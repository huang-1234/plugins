import type { IReportData, PerformanceMonitorMetrics, PerformanceMonitorOps } from "../types";

export class PerformanceMonitor {
  private readonly config: Required<PerformanceMonitorOps>;
  private metrics: PerformanceMonitorMetrics;
  private isStarted: boolean = false;
  public isReported: boolean = false;
  private isStopped: boolean = false;
  private observers: PerformanceObserver[] = [];
  private reportTimer: ReturnType<typeof setTimeout> | null = null;
  private lcpEntries: PerformanceEntry[] = [];
  private inpEntries: PerformanceEntry[] = [];
  private clsValue: number = 0;
  private ttiResolve?: () => void;

  constructor(options: PerformanceMonitorOps = {} as PerformanceMonitorOps) {
    const defaultConfig: PerformanceMonitorOps = {
      warnings: {
        FCP: 2000,
        LCP: 2500,
        TTI: 5000,
        FID: 100,
        INP: 200,
        CLS: 0.1,
      },
      reportUrl: '',
      appId: 'WEB_APP',
      debug: false,
      isDev: false,
      maxTime: 500,
      deviceType: 'auto',
      networkType: 'unknown',
      pageInfo: {
        pageUrl: window?.location?.href,
        pageTitle: document?.title,
        routeId: 'initial'
      }
    };

    this.config = {
      warnings: {
        ...defaultConfig.warnings,
        ...options.warnings
      },
      reportUrl: options.reportUrl || '',
      appId: options.appId || 'WEB_APP',
      debug: options.debug || false,
      isDev: options.isDev || false,
      maxTime: options.maxTime || defaultConfig.maxTime || 500,
      deviceType: options.deviceType || 'auto',
      networkType: options.networkType || 'unknown',
      pageInfo: options.pageInfo || {
        pageUrl: window.location.href,
        pageTitle: document.title,
        routeId: 'initial'
      }
    };

    this.metrics = {
      DNS: 0,
      TCP: 0,
      SSL: 0,
      TTFB: 0,
      FCP: 0,
      FMP: 0,
      DCL: 0,
      LCP: 0,
      TTI: 0,
      FID: 0,
      INP: 0,
      CLS: 0,
      networkType: 'unknown',
      deviceType: 'desktop'
    };
  }

  private detectDeviceType(): 'mobile' | 'desktop' {
    if (this.config.deviceType !== 'auto') {
      return this.config.deviceType;
    }
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      ? 'mobile'
      : 'desktop';
  }

  private detectNetworkType(): string {
    const connection = (navigator as any)?.connection;
    if (!connection) return 'unknown';

    const mobileTypes = ['slow-2g', '2g', '3g', '4g', '5g'];
    if (mobileTypes.includes(connection.effectiveType)) {
      return connection.effectiveType;
    }

    return connection.type || 'unknown';
  }

  private getDeviceMemory(): number | undefined {
    return (navigator as any)?.deviceMemory;
  }

  private getCPUCores(): number | undefined {
    return (navigator as any)?.hardwareConcurrency;
  }

  private initPerfTiming() {
    if (!('timing' in performance)) return;

    const t = performance.timing;
    this.metrics = {
      ...this.metrics,
      DNS: t.domainLookupEnd - t.domainLookupStart,
      TCP: t.connectEnd - t.connectStart,
      SSL: t.secureConnectionStart ? t.connectEnd - t.secureConnectionStart : 0,
      TTFB: t.responseStart - t.requestStart,
      DCL: t.domContentLoadedEventStart - t.navigationStart
    };
  }

  private logDebug(message: string) {
    if (this.config.debug) {
      console.debug(`[PerformanceMonitor] ${message}`);
    }
  }

  start(): void {
    if (this.isStarted) {
      this.logDebug('Monitoring already started');
      return;
    }

    this.isStarted = true;
    this.logDebug('Performance monitoring started');

    this.metrics.deviceType = this.detectDeviceType();
    this.metrics.networkType = this.detectNetworkType();
    this.metrics.memory = this.getDeviceMemory();
    this.metrics.cpuCores = this.getCPUCores();

    this.initPerfTiming();

    // FCP
    const fcpObserver = new PerformanceObserver(list => {
      const entries = list.getEntriesByName('first-contentful-paint');
      if (entries.length > 0) {
        this.metrics.FCP = Math.round(entries[0]?.startTime);
        fcpObserver.disconnect();
        this.logDebug(`FCP: ${this.metrics.FCP}ms`);
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
    this.observers.push(fcpObserver);

    // LCP - 修复element属性问题
    const lcpObserver = new PerformanceObserver(list => {
      // @ts-ignore
      const entries = list.getEntries() as LargestContentfulPaint[];
      const lastEntry = entries?.[entries?.length - 1];

      if (lastEntry.element &&
          lastEntry.element.tagName === 'DIV' &&
          lastEntry?.element?.classList?.contains('ad-container')) {
        return;
      }

      this.lcpEntries.push(lastEntry);
      this.metrics.LCP = Math.round(lastEntry?.startTime);

      if (lastEntry?.element) {
        this.metrics.LCPElement = `${lastEntry?.element?.tagName}.${Array.from(lastEntry?.element?.classList).join('.')}`;
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    this.observers.push(lcpObserver);

    // FID
    const fidObserver = new PerformanceObserver(list => {
      list?.getEntries()?.forEach?.(entry => {
        if (!this.metrics.FID) {
          const isCriticalInteraction = ['button', 'a', 'input'].some(tag =>
            (entry as any)?.target?.tagName === tag.toUpperCase()
          );

          if (isCriticalInteraction) {
            this.metrics.FID = 'duration' in entry
              ? Math.round(entry.duration)
              : Math.round((entry as any)?.processingStart - (entry as any)?.startTime);
            this.logDebug(`FID: ${this.metrics.FID}ms`);
          }
        }
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
    this.observers.push(fidObserver);

    // INP - 修复durationThreshold问题
    const inpObserver = new PerformanceObserver(list => {
      list?.getEntries()?.forEach?.(entry => {
        if (entry.duration > 0 && (entry as any)?.interactionId) {
          this.inpEntries.push(entry);
          this.metrics.INP = Math.max(
            this.metrics.INP,
            Math.round(entry.duration)
          );
        }
      });
    });
    inpObserver.observe({
      type: 'event',
      buffered: true,
      // 使用类型断言解决durationThreshold问题
    } as PerformanceObserverInit);
    this.observers.push(inpObserver);

    // CLS - 修复hadRecentInput属性问题
    const clsObserver = new PerformanceObserver(list => {
      list?.getEntries()?.forEach?.(entry => {
        // 使用类型断言解决hadRecentInput问题
        // @ts-ignore
        const layoutShiftEntry = entry as LayoutShift;
        if (layoutShiftEntry.entryType === 'layout-shift' && !layoutShiftEntry.hadRecentInput) {
          this.clsValue += layoutShiftEntry.value;
          this.metrics.CLS = parseFloat(this.clsValue.toFixed(4));
        }
      });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    this.observers.push(clsObserver);

    // TTI
    const checkTTI = () => {
      const resources = performance.getEntriesByType('resource');
      const pendingResources = resources.filter(r =>
        !(r as any)?.responseEnd || (r as any)?.responseEnd === 0
      );

      const longTasks = performance.getEntriesByType('longtask');
      const lastLongTask = longTasks.length > 0
        ? Math.max(...longTasks.map(lt => lt.startTime + lt.duration))
        : 0;

      const now = performance.now();
      /** @desc 静默期时间 */
      const quietPeriod = now - Math.max(
        this.metrics.LCP || 0,
        lastLongTask
      );

      const quietThreshold = this.metrics.networkType?.includes?.('2g') ? 7000 : 5000;

      if (
        pendingResources.length === 0 &&
        quietPeriod > quietThreshold &&
        this.metrics.FCP && this.metrics.FCP > 0
      ) {
        this.metrics.TTI = Math.round(now);
        this.logDebug(`TTI: ${this.metrics.TTI}ms`);
        if (this.ttiResolve) this.ttiResolve();
      } else {
        setTimeout(checkTTI, 500);
      }
    };

    if (this.metrics.FCP) {
      checkTTI();
    } else {
      const interval = setInterval(() => {
        if (this.metrics.FCP) {
          clearInterval(interval);
          checkTTI();
        }
      }, 100);
    }

    this.reportTimer = setTimeout(() => {
      if (!this.isReported) this.report();
    }, this.config.maxTime);

    window.addEventListener('pagehide', () => this.report());
    window.addEventListener('beforeunload', () => this.report());

    if ((window as any)?.__isSpa) {
      window.addEventListener('routeChange', () => {
        this.report();
        this.resetForNextRoute();
      });
    }
  }

  private resetForNextRoute() {
    this.isReported = false;
    this.lcpEntries = [];
    this.inpEntries = [];
    this.clsValue = 0;

    this.metrics = {
      ...this.metrics,
      FCP: 0,
      LCP: 0,
      TTI: 0,
      FID: 0,
      INP: 0,
      CLS: 0
    };

    this.start();
  }

  report(): void {
    if (this.isReported || !this.isStarted) return;

    this.isReported = true;
    this.dispose();

    if (this.lcpEntries.length > 0) {
      const maxLcpEntry = [...this.lcpEntries]?.sort((a, b) =>
        b.startTime - a.startTime
      )?.[0];
      this.metrics.LCP = Math.round(maxLcpEntry.startTime);
    }

    if (this.inpEntries.length > 0) {
      const durations = this.inpEntries?.map(e => e.duration)?.sort?.((a, b) => a - b);
      const percentileIndex = Math.floor(this.inpEntries.length * 0.98);
      this.metrics.INP = Math.round(durations[percentileIndex]);
    }

    const reportData: IReportData = {
      appId: this.config.appId,
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      userAgent: navigator.userAgent,
      pageInfo: this.config.pageInfo,
      warnings: this.checkWarnings(),
      environment: {
        networkType: this.metrics.networkType,
        deviceType: this.metrics.deviceType,
        memory: this.metrics.memory,
        cpuCores: this.metrics.cpuCores
      }
    };

    if (this.config.isDev) {
      this.renderReport(reportData);
    }

    if (this.config.reportUrl) {
      this.sendReport(reportData);
    }
  }

  private checkWarnings() {
    const warnings = [] as string[];
    const metrics = this.metrics;
    const threshold = this.config.warnings;

    const isMobile = this.metrics.deviceType === 'mobile';
    const mobileFactor = isMobile ? 1.3 : 1;

    if (metrics.FCP && metrics.FCP > Number(threshold?.FCP) * mobileFactor)
      warnings.push(`FCP ${metrics.FCP}ms > ${Number(threshold?.FCP) * mobileFactor}ms`);

    if (metrics.LCP && metrics.LCP > Number(threshold?.LCP) * mobileFactor)
      warnings.push(`LCP ${metrics.LCP}ms > ${Number(threshold?.LCP) * mobileFactor}ms`);

    if (metrics.TTI && metrics.TTI > Number(threshold?.TTI) * mobileFactor)
      warnings.push(`TTI ${metrics.TTI}ms > ${Number(threshold?.TTI) * mobileFactor}ms`);

    if (metrics.FID && metrics.FID > Number(threshold?.FID) * mobileFactor)
      warnings.push(`FID ${metrics.FID}ms > ${Number(threshold?.FID) * mobileFactor}ms`);

    if (metrics.INP && metrics.INP > Number(threshold?.INP) * mobileFactor)
      warnings.push(`INP ${metrics.INP}ms > ${Number(threshold?.INP) * mobileFactor}ms`);

    if (metrics.CLS && metrics.CLS > Number(threshold?.CLS))
      warnings.push(`CLS ${metrics.CLS} > ${threshold?.CLS}`);

    return warnings;
  }

  private renderReport(report: IReportData) {
    const containerId = 'performance-monitor-container';
    let container = document.getElementById(containerId);

    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.95);
        border-top: 1px solid #ddd;
        padding: 12px;
        z-index: 9999;
        max-height: 50vh;
        overflow-y: auto;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        font-size: 14px;
      `;
      document.body.appendChild(container);
    }

    const isMobile = this.metrics.deviceType === 'mobile';
    const gridStyle = isMobile
      ? 'display:block;'
      : 'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;';

    let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <h3 style="margin:0;color:#2c3e50;font-size:16px;">性能报告</h3>
      <button style="background:none;border:none;cursor:pointer;font-size:20px;"
              onclick="this.parentElement.parentElement.remove()">×</button>
    </div>`;

    html += `<div style="${gridStyle}">`;
    for (const [key, value] of Object.entries(report.metrics)) {
      if (typeof value === 'number' && value >= 0) {
        const isWarning = this.checkWarnings()?.some?.(w => w.includes(key));
        const valueStyle = isWarning ? 'color:#e74c3c;font-weight:bold;' : '';

        html += `<div style="margin-bottom:6px;">
          <strong>${key}:</strong>
          <span style="${valueStyle}">
            ${key === 'CLS' ? value.toFixed(4) : value + 'ms'}
          </span>
        </div>`;
      }
    }
    html += `</div>`;

    html += `<div style="margin-top:10px;font-size:13px;color:#666;">
      <div><strong>设备:</strong> ${report.environment?.deviceType}</div>
      <div><strong>网络:</strong> ${report.environment?.networkType}</div>
      ${report.environment?.memory ? `<div><strong>内存:</strong> ${report.environment?.memory}GB</div>` : ''}
      ${report.environment?.cpuCores ? `<div><strong>CPU核心:</strong> ${report.environment?.cpuCores}</div>` : ''}
    </div>`;

    if (report.warnings?.length > 0) {
      html += `<div style="margin-top:12px;padding:8px;background:#fff8f8;border-radius:4px;border-left:3px solid #e74c3c;">`;
      html += `<div style="font-weight:bold;color:#e74c3c;margin-bottom:6px;">性能警告：</div>`;
      report.warnings?.forEach?.((w: string) => html += `<div style="margin-bottom:4px;">${w}</div>`);
      html += `</div>`;
    }

    container.innerHTML = html;
  }

  private sendReport(data: any) {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(this.config.reportUrl, blob);
    } else {
      fetch(this.config.reportUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
      }).catch(e => this.logDebug(`Report failed: ${e}`));
    }
  }

  dispose(): void {
    if (this.isStopped) return;

    this.isStopped = true;
    this.logDebug('Disposing performance monitors');

    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];

    if (this.reportTimer) {
      clearTimeout(this.reportTimer);
      this.reportTimer = null;
    }
  }
}

// 使用 Demo
// React.useEffect(() => {
//   // 创建监控实例并启动
//   // 使用示例
//   const monitor = new PerformanceMonitor({
//     appId: 'mobile-ecommerce',
//     reportUrl: '/api/performance',
//     warnings: {
//       FCP: 1800,
//       LCP: 2000,
//       TTI: 3500, // 移动端TTI阈值更严格
//       FID: 80,
//       INP: 180, // 新增INP阈值
//       CLS: 0.12,
//     },
//     debug: true,
//     deviceType: 'auto',
//     pageInfo: {
//       pageUrl: window.location.href,
//       pageTitle: document.title,
//       routeId: 'product-detail', // SPA路由标识
//     },
//   });

//   monitor.start();

//   function report() {
//     if (!monitor.report) {
//       monitor.report();
//     }
//   }

//   // 模拟在页面准备完成后报告性能数据
//   window.addEventListener('load', () => {
//     // 在实际SPA应用中，可在路由切换时调用report()
//     setTimeout(report, 3000);
//   });

//   return () => {
//     monitor.dispose();
//     window.removeEventListener('load', report);
//   };
// }, []);
