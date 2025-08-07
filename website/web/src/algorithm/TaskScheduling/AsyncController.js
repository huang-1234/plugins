/**
 * 异步控制器
 * @param {number} concurrency 并发量
 * @param {number} minRequests 最小请求数
 */
class AsyncController {
  constructor(concurrency, minRequests = 1) {
    /** 最大并发量 */
    this.maxConcurrency = concurrency;
    /** 最小并发量 */
    this.minConcurrency = minRequests;
    /** 任务队列 */
    this.queue = [];
    /** 结果队列 */
    this.results = [];
    /** 正在进行的任务数 */
    this.inProgress = 0;
    /** 当前结果索引 */
    this.index = 0;
    /** 未解决的 Promise */
    this.pendingResolves = new Map();
  }

  /**
   * 运行任务
   * @param {Array} tasks 任务数组
   * @returns {Promise} 结果
   */
  async run(tasks) {
    this.results = new Array(tasks.length);

    return new Promise((resolve) => {
      this.finalResolve = resolve;
      tasks.forEach((task, i) => this._enqueue(task, i));
      this._processQueue();
    });
  }

  /**
   * 入队
   * @param {Function} task 任务
   * @param {number} idx 任务索引
   */
  _enqueue(task, idx) {
    this.queue.push(async () => {
      try {
        // 记录原始索引用于结果排序
        const result = await task();
        return { idx, result };
      } catch (error) {
        return { idx, error };
      }
    });
  }

  /**
   * 处理队列
   */
  _processQueue() {
    // 动态调整并发量：根据队列长度优化吞吐量
    const effectiveConcurrency = Math.max(
      this.minConcurrency,
      Math.min(
        this.maxConcurrency,
        Math.ceil(this.queue.length / 2)
      )
    );

    while (this.inProgress < effectiveConcurrency && this.queue.length) {
      this.inProgress++;
      const operation = this.queue.shift();
      operation().then(this._handleResult.bind(this));
    }
  }

  /**
   * 处理结果
   * @param {Object} result 结果
   * @param {number} result.idx 任务索引
   * @param {any} result.result 结果
   * @param {any} result.error 错误
   */
  _handleResult({ idx, result, error }) {
    // 存储原始索引位置的结果
    this.results[idx] = error
      ? { status: 'rejected', reason: error }
      : { status: 'fulfilled', value: result };

    // 顺序传递结果给调用方
    while (this.index < this.results.length) {
      const current = this.results[this.index];
      if (!current) break;

      if (this.pendingResolves.has(this.index)) {
        this.pendingResolves.get(this.index)(current);
      }
      this.index++;
    }

    this.inProgress--;
    this._processQueue();

    // 完成所有任务
    if (this.index === this.results.length && this.inProgress === 0) {
      this.finalResolve(this.results);
    }
  }

  // 可选：按需获取有序结果（流式处理）
  /**
   * 按需获取有序结果
   * @param {number} idx 任务索引
   * @returns {Promise} 结果
   */
  async getOrderedResult(idx) {
    if (this.results[idx]) {
      return this.results[idx];
    }
    return new Promise((resolve) => {
      this.pendingResolves.set(idx, resolve);
    });
  }
}

// 使用示例
async function main() {
  const tasks = [
    () => new Promise(res => setTimeout(() => res('Task1'), 300)),
    () => new Promise(res => setTimeout(() => res('Task2'), 100)),
    () => new Promise((_, rej) => setTimeout(() => rej('Task3 error'), 200)),
    () => new Promise(res => setTimeout(() => res('Task4'), 150)),
    () => new Promise(res => setTimeout(() => res('Task5'), 250)),
    () => new Promise(res => setTimeout(() => res('Task6'), 200)),
    () => new Promise(res => setTimeout(() => res('Task7'), 300)),
    () => new Promise(res => setTimeout(() => res('Task8'), 200)),
    () => new Promise(res => setTimeout(() => res('Task9'), 200)),
    () => new Promise(res => setTimeout(() => res('Task10'), 200)),
    () => new Promise(res => setTimeout(() => res('Task11'), 200)),
    () => new Promise(res => setTimeout(() => res('Task12'), 200)),
    () => new Promise(res => setTimeout(() => res('Task13'), 200)),
    () => new Promise(res => setTimeout(() => res('Task14'), 200)),
    () => new Promise(res => setTimeout(() => res('Task15'), 200)),
    () => new Promise(res => setTimeout(() => res('Task16'), 200)),
  ];

  const controller = new AsyncController(4, 2); // 并发2-4
  const results = await controller.run(tasks);

  console.log('最终结果:');
  results.forEach((res, i) =>
    console.log(`${i + 1}:`, res.status === 'fulfilled' ? res.value : res.reason)
  );
}

main().catch(console.error);