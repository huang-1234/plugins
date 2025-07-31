// 内存信息接口定义
export interface TabMemoryInfo {
  tabId: number;
  title: string;
  url: string;
  heapSize: number;  // 使用的JS堆大小（字节）
  totalHeapSize: number;  // 总JS堆大小（字节）
  domNodeCount: number;  // DOM节点数量
  eventListenerCount?: number;  // 事件监听器数量
  timestamp: number;  // 采样时间戳
  leakStatus: 'normal' | 'warning' | 'critical';  // 泄漏状态
}

// 内存历史记录接口
export interface MemoryHistory {
  tabId: number;
  samples: Array<{
    timestamp: number;
    heapSize: number;
    domNodeCount: number;
  }>;
}

// 泄漏检测配置接口
export interface LeakDetectionConfig {
  heapThreshold: number;  // 堆内存阈值（MB）
  growthRateThreshold: number;  // 增长率阈值（百分比/分钟）
  sampleInterval: number;  // 采样间隔（毫秒）
  windowSize: number;  // 滑动窗口大小（采样点数）
  domNodeThreshold: number;  // DOM节点阈值
  enabled: boolean;  // 是否启用检测
}

// 消息类型
export type MessageType =
  | { type: 'memoryUpdate'; tabId: number; data: Partial<TabMemoryInfo> }
  | { type: 'configUpdate'; config: LeakDetectionConfig }
  | { type: 'requestMemoryData'; tabId?: number }
  | { type: 'memoryDataResponse'; tabs: TabMemoryInfo[] }
  | { type: 'leakDetected'; tabId: number; severity: 'warning' | 'critical'; details: string }
  | { type: 'requestConfig';   }