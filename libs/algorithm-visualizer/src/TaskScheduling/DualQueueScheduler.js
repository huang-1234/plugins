class DualQueueScheduler {
  constructor(concurrency) {
    this.concurrency = concurrency;
    this.normalQueue = [];   // 普通队列
    this.urgentQueue = [];   // 紧急队列
    this.running = 0;
  }

  // 添加普通任务
  addNormalTask(task) {
    this.normalQueue.push(task);
    this._schedule();
  }

  // 添加紧急任务（插队）
  addUrgentTask(task) {
    this.urgentQueue.push(task);
    this._schedule();
  }

  _schedule() {
    while (this.running < this.concurrency &&
          (this.urgentQueue.length > 0 || this.normalQueue.length > 0)) {
      // 优先执行紧急队列
      const task = this.urgentQueue.length > 0
        ? this.urgentQueue.shift()
        : this.normalQueue.shift();

      this.running++;
      task().finally(() => {
        this.running--;
        this._schedule();
      });
    }
  }
}