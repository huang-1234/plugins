import type { IReportData, PerformanceMonitorMetrics, PerformanceMonitorOps } from "../types";

/**
 * 前端性能监控类
 * 基于 Web Performance API 实现核心性能指标监控
 * 支持 Core Web Vitals (LCP, CLS, INP) 和传统指标 (FCP, TTI, TTFB)
 */
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
  private clsEntries: {value: number, startTime: number}[] = [];
  private clsSessionValues: number[] = [];
  private clsSessionTimeout: ReturnType<typeof setTimeout> | null = null;
  private ttiResolve?: () => void;

  constructor(options: PerformanceMonitorOps = {} as PerformanceMonitorOps) {
    const defaultConfig: PerformanceMonitorOps = {
      warnings: {
        FCP: 1800, // ≤1.8秒（优秀）
        LCP: 2500, // ≤2.5秒（优秀）
        TTI: 5000, // ≤5秒（优秀）
        FID: 100,  // ≤100ms（优秀）
        INP: 200,  // ≤200ms（优秀）
        CLS: 0.1,  // ≤0.1（优秀）
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
      DNS: 0,       // DNS解析时间
      TCP: 0,       // TCP连接时间
      SSL: 0,       // SSL握手时间
      TTFB: 0,      // 首字节时间
      FCP: 0,       // 首次内容渲染
      FMP: 0,       // 首次有意义渲染
      DCL: 0,       // DOM内容加载完成
      LCP: 0,       // 最大内容渲染
      TTI: 0,       // 可交互时间
      FID: 0,       // 首次输入延迟
      INP: 0,       // 交互到下一次渲染延迟
      CLS: 0,       // 累积布局偏移
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
    return navigator?.hardwareConcurrency;
  }

  private initPerfTiming() {
    // 优先使用更新的Navigation Timing API
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navEntry) {
      this.metrics = {
        ...this.metrics,
        DNS: navEntry.domainLookupEnd - navEntry.domainLookupStart,
        TCP: navEntry.connectEnd - navEntry.connectStart,
        SSL: navEntry.secureConnectionStart ? navEntry.connectEnd - navEntry.secureConnectionStart : 0,
        TTFB: navEntry.responseStart - navEntry.requestStart,
        DCL: navEntry.domContentLoadedEventStart
      };
    }
    // 降级使用旧版API
    else if ('timing' in performance) {
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

    // LCP - 最大内容渲染时间
    const lcpObserver = new PerformanceObserver(list => {
      // @ts-ignore
      const entries = list.getEntries() as LargestContentfulPaint[];
      const lastEntry = entries?.[entries?.length - 1];

      // 过滤非主体内容，例如广告容器
      if (lastEntry?.element) {
        const isAdContainer =
          lastEntry.element.tagName === 'DIV' &&
          (lastEntry?.element?.classList?.contains('ad-container') ||
           lastEntry?.element?.id === 'ad-banner' ||
           lastEntry?.element?.closest('[data-ad]'));

        if (isAdContainer) {
          return;
        }
      }

      this.lcpEntries.push(lastEntry);
      this.metrics.LCP = Math.round(lastEntry?.startTime);

      if (lastEntry?.element) {
        // 记录LCP元素信息，便于调试和优化
        this.metrics.LCPElement = `${lastEntry?.element?.tagName}.${Array.from(lastEntry?.element?.classList || []).join('.')}`;
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    this.observers.push(lcpObserver);

    // FID - 首次输入延迟
    const fidObserver = new PerformanceObserver(list => {
      list?.getEntries()?.forEach?.(entry => {
        if (!this.metrics.FID) {
          // 检查是否为关键交互元素
          const isCriticalInteraction = ['button', 'a', 'input', 'select', 'textarea'].some(tag =>
            (entry as any)?.target?.tagName === tag.toUpperCase()
          );

          if (isCriticalInteraction) {
            // 按照标准，FID是从用户交互到浏览器能够响应的时间
            // processingStart - startTime 是标准的FID计算方式
            this.metrics.FID = Math.round((entry as any)?.processingStart - (entry as any)?.startTime);
            this.logDebug(`FID: ${this.metrics.FID}ms`);
          }
        }
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
    this.observers.push(fidObserver);

    // INP - 交互到下一次渲染延迟
    const inpObserver = new PerformanceObserver(list => {
      list?.getEntries()?.forEach?.(entry => {
        // 只记录有效的交互事件，并且过滤掉持续时间低于40ms的事件
        if (entry.duration > 40 && (entry as any)?.interactionId) {
          this.inpEntries.push(entry);

          // 实时更新INP值，但最终报告时会重新计算98百分位数
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
      durationThreshold: 40, // 过滤40ms以下的低耗时操作
    } as PerformanceObserverInit);
    this.observers.push(inpObserver);

    // CLS - 实现会话窗口机制，符合标准计算方法
    const clsObserver = new PerformanceObserver(list => {
      list?.getEntries()?.forEach?.(entry => {
        // 使用类型断言解决hadRecentInput问题
        // @ts-ignore
        const layoutShiftEntry = entry as LayoutShift;
        if (layoutShiftEntry.entryType === 'layout-shift' && !layoutShiftEntry.hadRecentInput) {
          // 记录每次偏移及其时间
          this.clsEntries.push({
            value: layoutShiftEntry.value,
            startTime: layoutShiftEntry.startTime
          });

          // 处理会话窗口
          this.processClsSessionWindows();

          // 更新当前CLS值
          this.metrics.CLS = this.calculateFinalCLS();
        }
      });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    this.observers.push(clsObserver);

    // TTI - 实现符合标准的TTI计算逻辑
    const checkTTI = () => {
      // 检查关键资源是否加载完成
      const resources = performance.getEntriesByType('resource');
      const criticalResourceTypes = ['script', 'stylesheet', 'fetch', 'xmlhttprequest'];
      const criticalResources = resources.filter(r => {
        const resourceType = (r as PerformanceResourceTiming).initiatorType;
        return criticalResourceTypes.includes(resourceType);
      });

      const pendingResources = criticalResources.filter(r =>
        !(r as any)?.responseEnd || (r as any)?.responseEnd === 0
      );

      // 检查是否有长任务
      const longTasks = performance.getEntriesByType('longtask');
      const lastLongTask = longTasks.length > 0
        ? Math.max(...longTasks.map(lt => lt.startTime + lt.duration))
        : 0;

      const now = performance.now();
      /** @desc 静默期时间 - 最后一个长任务结束后的时间 */
      const quietPeriod = now - Math.max(
        this.metrics.LCP || 0,
        lastLongTask
      );

      // 根据网络环境动态调整静默期阈值
      // 弱网环境下静默期阈值延长至7秒
      const quietThreshold = this.metrics.networkType?.includes?.('2g') ? 7000 : 5000;

      if (
        pendingResources.length === 0 && // 关键资源加载完成
        quietPeriod > quietThreshold && // 主线程连续5秒无长任务
        this.metrics.FCP && this.metrics.FCP > 0 // FCP已完成
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

  /**
   * 处理CLS会话窗口
   * 实现5秒内连续发生的多次偏移合并为一个会话窗口的机制
   */
  private processClsSessionWindows(): void {
    if (this.clsSessionTimeout) {
      clearTimeout(this.clsSessionTimeout);
    }

    // 5秒会话窗口结束后，计算当前会话的累积值
    this.clsSessionTimeout = setTimeout(() => {
      if (this.clsEntries.length > 0) {
        // 计算当前会话窗口的CLS值
        const sessionValue = this.clsEntries.reduce((sum, entry) => sum + entry.value, 0);
        this.clsSessionValues.push(sessionValue);

        // 清空当前会话的条目
        this.clsEntries = [];
      }
    }, 5000); // 5秒会话窗口
  }

  /**
   * 计算最终CLS值
   * 取所有会话窗口中的最大值
   */
  private calculateFinalCLS(): number {
    // 计算当前会话的临时值
    const currentSessionValue = this.clsEntries.reduce((sum, entry) => sum + entry.value, 0);

    // 取所有会话中的最大值
    const maxSessionValue = Math.max(
      ...this.clsSessionValues,
      currentSessionValue
    );

    return parseFloat(maxSessionValue.toFixed(4));
  }

  private resetForNextRoute() {
    this.isReported = false;
    this.lcpEntries = [];
    this.inpEntries = [];
    this.clsEntries = [];
    this.clsSessionValues = [];
    this.clsValue = 0;

    if (this.clsSessionTimeout) {
      clearTimeout(this.clsSessionTimeout);
      this.clsSessionTimeout = null;
    }

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
      // 按照INP标准，取所有交互事件持续时间的第98百分位数
      const durations = this.inpEntries?.map(e => e.duration)?.sort?.((a, b) => a - b);
      const percentileIndex = Math.floor(this.inpEntries.length * 0.98);
      this.metrics.INP = Math.round(durations[percentileIndex] || durations[durations.length - 1]);
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

  /**
   * 检查性能指标是否超出阈值
   * 根据文档中的「动态修正策略」，移动端阈值放宽30%
   */
  private checkWarnings() {
    const warnings = [] as string[];
    const metrics = this.metrics;
    const threshold = this.config.warnings;

    // 移动端阈值放宽30%
    const isMobile = this.metrics.deviceType === 'mobile';
    const mobileFactor = isMobile ? 1.3 : 1;

    // 根据文档中的阈值标准进行判断
    // FCP: ≤1.8秒（优秀），1.8-3秒（需优化），>3秒（较差）
    if (metrics.FCP) {
      const limit = Number(threshold?.FCP) * mobileFactor;
      if (metrics.FCP > limit) {
        const severity = metrics.FCP > limit * 1.5 ? '较差' : '需优化';
        warnings.push(`FCP ${metrics.FCP}ms > ${limit}ms (${severity})`);
      }
    }

    // LCP: ≤2.5秒（优秀），2.5-4秒（需优化），>4秒（较差）
    if (metrics.LCP) {
      const limit = Number(threshold?.LCP) * mobileFactor;
      if (metrics.LCP > limit) {
        const severity = metrics.LCP > 4000 * mobileFactor ? '较差' : '需优化';
        warnings.push(`LCP ${metrics.LCP}ms > ${limit}ms (${severity})`);
      }
    }

    // TTI: ≤5秒（优秀），5-7秒（需优化），>7秒（较差）
    if (metrics.TTI) {
      const limit = Number(threshold?.TTI) * mobileFactor;
      if (metrics.TTI > limit) {
        const severity = metrics.TTI > 7000 * mobileFactor ? '较差' : '需优化';
        warnings.push(`TTI ${metrics.TTI}ms > ${limit}ms (${severity})`);
      }
    }

    // FID: ≤100ms（优秀），100-300ms（需优化），>300ms（较差）
    if (metrics.FID) {
      const limit = Number(threshold?.FID) * mobileFactor;
      if (metrics.FID > limit) {
        const severity = metrics.FID > 300 * mobileFactor ? '较差' : '需优化';
        warnings.push(`FID ${metrics.FID}ms > ${limit}ms (${severity})`);
      }
    }

    // INP: ≤200ms（优秀），200-500ms（需优化），>500ms（较差）
    if (metrics.INP) {
      const limit = Number(threshold?.INP) * mobileFactor;
      if (metrics.INP > limit) {
        const severity = metrics.INP > 500 * mobileFactor ? '较差' : '需优化';
        warnings.push(`INP ${metrics.INP}ms > ${limit}ms (${severity})`);
      }
    }

    // CLS: ≤0.1（优秀），0.1-0.25（需优化），>0.25（较差）
    // 注意：CLS不受移动端放宽因子影响
    if (metrics.CLS) {
      const limit = Number(threshold?.CLS);
      if (metrics.CLS > limit) {
        const severity = metrics.CLS > 0.25 ? '较差' : '需优化';
        warnings.push(`CLS ${metrics.CLS} > ${limit} (${severity})`);
      }
    }

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
    // 使用 navigator.sendBeacon 异步上报，失败时降级为 fetch+keepalive
    // 符合文档中的「上报优化」建议
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const success = navigator.sendBeacon(this.config.reportUrl, blob);

      if (!success) {
        // sendBeacon失败，降级使用fetch
        this.sendReportWithFetch(data);
      }
    } else {
      this.sendReportWithFetch(data);
    }
  }

  private sendReportWithFetch(data: any) {
    fetch(this.config.reportUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true
    }).catch(e => this.logDebug(`Report failed: ${e}`));
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
