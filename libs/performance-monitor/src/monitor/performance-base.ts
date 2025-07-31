import type { RadarReport } from "../plugins/radar-report";

// 性能监控系统基类（线程安全设计）
export abstract class PerformanceBase<T extends unknown = {}> {
  protected readonly worker: Worker | null = null;
  protected metrics: Record<string, number | string> = {};
  private radarPlugin: RadarReport<T> | null = null;
  public onUpdate?: (data: T) => void;

  constructor() {
    // 使用 Web Worker 卸载计算任务
    if (window.Worker) {
      this.worker = new Worker('performance-worker.js');
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
    }
  }

  // 注册上报插件
  use(plugin: RadarReport<T>): this {
    this.radarPlugin = plugin;
    return this;
  }

  // 抽象方法 - 子类实现具体监控逻辑
  protected abstract startMonitoring(): void;
  protected abstract stopMonitoring(): void;

  // Worker 消息处理（模板方法）
  private handleWorkerMessage(event: MessageEvent) {
    const { type, data } = event.data;
    this.metrics[type] = data;

    // 实时上报（非阻塞）
    requestIdleCallback(() => {
      this.radarPlugin?.report({ [type]: data } as unknown as T);
    });
  }

  // 线程安全的数据传输
  protected postToWorker(message: object) {
    this.worker?.postMessage(message);
  }

  // 资源清理
  destroy() {
    this.worker?.terminate();
    this.stopMonitoring();
  }
}
