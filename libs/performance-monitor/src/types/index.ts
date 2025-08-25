export interface IMonitorWarning {
  /**
   * @desc 浏览器首次内容绘制时间
   */
  FCP?: number;
  /**
   * @desc ​​LCP 测量逻辑​​
   * 1. ​​目标​​：捕获视口内最大元素（图片、文本块等）完全渲染的时间点。
   * 2. ​​API​​：通过 PerformanceObserver监听 largest-contentful-paint事件，动态更新最大元素的时间戳。
   * 3. ​​关键修正​​：过滤非主体内容（如广告容器），避免干扰真实用户体验评估
   */
  LCP: number;
  /**
   * @desc 浏览器可交互时间
   */
  TTI?: number;
  /**
   * @desc 首次输入延迟
   */
  FID?: number;
  /**
   * @desc 输入延迟和输入响应时间
   */
  INP?: number;
  /**
   * @desc ​​CLS 测量逻辑​​
   * ​​1. 目标​​：累计非用户触发的布局偏移分数（偏移距离 × 影响区域）。
   * ​2. API​​：监听 layout-shift事件，忽略 hadRecentInput=true的偏移（用户交互后 500ms 内的偏移不计数）。
   * ​​3. 会话窗口机制​​：5 秒内连续发生的多次偏移合并为一个会话窗口，取窗口内累计最大值作为最终 CLS 值
   */
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
