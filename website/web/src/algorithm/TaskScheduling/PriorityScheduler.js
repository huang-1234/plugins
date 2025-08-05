class PriorityScheduler {
  constructor(concurrency) {
    this.concurrency = concurrency; // 最大并发数
    this.queue = [];                // 优先级队列（数组存储）
    this.running = 0;               // 运行中任务数
  }

  // 添加任务（支持优先级）
  addTask(task, priority = 0) {
    const taskWrapper = { task, priority };
    // 按优先级降序插入（优先数越大，优先级越高）
    let index = this.queue.findIndex(t => t.priority < priority);
    if (index === -1) this.queue.push(taskWrapper);
    else this.queue.splice(index, 0, taskWrapper);

    this._schedule();
  }

  _schedule() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const { task } = this.queue.shift(); // 取出最高优先级任务
      this.running++;
      task().finally(() => {
        this.running--;
        this._schedule(); // 递归调度
      });
    }
  }
}