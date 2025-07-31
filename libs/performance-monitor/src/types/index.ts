export interface IMonitorWarning {
    FCP?: number;
    LCP: number;
    TTI?: number;
    FID?: number;
    INP?: number;
    CLS?: number;
  }
  export interface PerformanceMonitorMetrics extends Required<IMonitorWarning> {
    DNS?: number;
    TCP?: number;
    SSL?: number;
    TTFB?: number;
    FMP?: number;
    DCL?: number;
    LCPElement?: string;
    networkType?: string;
    deviceType?: string;
    memory?: number;
    cpuCores?: number;
  }
  
  export interface PerformanceMonitorOps {
    warnings: IMonitorWarning;
    reportUrl: string;
    appId: string;
    debug?: boolean;
    isDev?: boolean;
    maxTime?: number;
    deviceType?: 'mobile' | 'desktop' | 'auto';
    networkType?: 'unknown' | '2g' | '3g' | '4g' | '5g' | 'slow-2g' | 'wifi' | 'ethernet';
    pageInfo?: {
      pageUrl: string;
      pageTitle: string;
      routeId?: string;
    };
  }
  
  
  export interface IReportData {
    appId: string;
    timestamp: string;
    metrics: PerformanceMonitorMetrics;
    userAgent: string;
    pageInfo?: {
      pageUrl: string;
      pageTitle: string;
      routeId?: string;
    };
    warnings: string[];
    environment: {
      networkType?: string;
      deviceType?: string;
      memory?: number;
      cpuCores?: number;
    };
  }
  

  
  // jank
  export interface PerformancePanelJank {
    /** 小卡顿 */
    small: number;
    /** 中卡顿 */
    medium: number;
    /** 大卡顿 */
    large: number;
    /** 卡顿率 */
    stutterRate: number;
    /** 严重卡顿率 */
    severeJankRate: number;
  }
  
  /**
   * 事件计时指标
   */
  export interface EventTimingMetrics {
    /** 平均事件处理延迟时间(ms) */
    avgDelay: number;
    /** 最大事件处理延迟时间(ms) */
    maxDelay: number;
  }
  
  export interface PerformancePanelMetrics {
    /** FPS */
    fps: number;
    /** 卡顿 */
    jank: PerformancePanelJank;
    /** 帧耗时 */
    frameTimes: number[];
    /** 事件计时 (可选，仅在支持 Event Timing API 时提供) */
    eventTiming?: EventTimingMetrics;
  }
  