import type { LeakDetectionConfig, TabMemoryInfo, MemoryHistory } from '../types';

// 默认泄漏检测配置
export const DEFAULT_CONFIG: LeakDetectionConfig = {
  heapThreshold: 500 * 1024 * 1024, // 500MB
  growthRateThreshold: 0.1, // 10%/分钟
  sampleInterval: 5000, // 5秒
  windowSize: 10, // 10个采样点（50秒）
  domNodeThreshold: 5000, // DOM节点阈值
  enabled: true
};

/**
 * 内存分析器类 - 负责分析内存使用趋势并检测潜在泄漏
 */
export class MemoryAnalyzer {
  private memoryHistory: Map<number, MemoryHistory> = new Map();
  private config: LeakDetectionConfig = DEFAULT_CONFIG;

  constructor(config?: Partial<LeakDetectionConfig>) {
    if (config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LeakDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 添加内存样本
   */
  addSample(tabInfo: TabMemoryInfo): void {
    const { tabId, heapSize, domNodeCount, timestamp } = tabInfo;

    if (!this.memoryHistory.has(tabId)) {
      this.memoryHistory.set(tabId, {
        tabId,
        samples: []
      });
    }

    const history = this.memoryHistory.get(tabId)!;
    history.samples.push({
      timestamp,
      heapSize,
      domNodeCount
    });

    // 限制历史记录大小，保留最近的样本
    if (history.samples.length > 100) {
      history.samples = history.samples.slice(-100);
    }
  }

  /**
   * 检测内存泄漏
   * 返回泄漏状态和详细信息
   */
  detectLeak(tabId: number): { status: 'normal' | 'warning' | 'critical'; details: string } {
    if (!this.config.enabled || !this.memoryHistory.has(tabId)) {
      return { status: 'normal', details: '未检测到异常' };
    }

    const history = this.memoryHistory.get(tabId)!;
    const { samples } = history;

    if (samples.length < this.config.windowSize) {
      return { status: 'normal', details: '样本数量不足' };
    }

    // 检查最新样本的堆大小是否超过阈值
    const latestSample = samples[samples.length - 1];
    if (latestSample.heapSize > this.config.heapThreshold) {
      return {
        status: 'warning',
        details: `内存使用超过阈值：${(latestSample.heapSize / (1024 * 1024)).toFixed(2)}MB > ${(this.config.heapThreshold / (1024 * 1024)).toFixed(2)}MB`
      };
    }

    // 计算增长率
    const windowSamples = samples.slice(-this.config.windowSize);
    const growthRate = this.calculateGrowthRate(windowSamples.map(s => s.heapSize));

    // 计算DOM节点增长率
    const domGrowthRate = this.calculateGrowthRate(windowSamples.map(s => s.domNodeCount));

    // 检查是否存在持续增长趋势
    if (growthRate > this.config.growthRateThreshold) {
      return {
        status: 'critical',
        details: `内存持续增长：${(growthRate * 100).toFixed(2)}%/分钟 > ${(this.config.growthRateThreshold * 100).toFixed(2)}%/分钟`
      };
    }

    // 检查DOM节点是否过多或增长过快
    if (latestSample.domNodeCount > this.config.domNodeThreshold || domGrowthRate > this.config.growthRateThreshold) {
      return {
        status: 'warning',
        details: `DOM节点异常：${latestSample.domNodeCount}个节点，增长率${(domGrowthRate * 100).toFixed(2)}%/分钟`
      };
    }

    return { status: 'normal', details: '未检测到异常' };
  }

  /**
   * 计算增长率（每分钟百分比）
   */
  private calculateGrowthRate(samples: number[]): number {
    if (samples.length < 2) return 0;

    // 计算线性回归斜率
    const n = samples.length;
    const timestamps = Array.from({ length: n }, (_, i) => i);

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += timestamps[i];
      sumY += samples[i];
      sumXY += timestamps[i] * samples[i];
      sumX2 += timestamps[i] * timestamps[i];
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // 如果第一个样本为0，使用第二个样本作为基准
    const baseValue = samples[0] || samples[1] || 1;

    // 计算每分钟的增长率（样本间隔为this.config.sampleInterval毫秒）
    const samplesPerMinute = 60000 / this.config.sampleInterval;
    return (slope * samplesPerMinute) / baseValue;
  }

  /**
   * 获取标签页的内存历史
   */
  getTabHistory(tabId: number): MemoryHistory | undefined {
    return this.memoryHistory.get(tabId);
  }

  /**
   * 获取所有标签页的内存历史
   */
  getAllTabsHistory(): Map<number, MemoryHistory> {
    return this.memoryHistory;
  }

  /**
   * 清除标签页的内存历史
   */
  clearTabHistory(tabId: number): void {
    this.memoryHistory.delete(tabId);
  }
}