class TaskLoop {
  /**
   *  @description 同时执行的最大任务数
   *  @param {number} concurrency  同时执行的最大任务数
   */
  concurrency;
  /**
   *  @description 当前正在执行的任务
   *  @type {Array<Function>} pendingQueue 当前正在执行的任务
   */
  pendingQueue = [];
  runningTask = 0;
  /**
   *  @description 执行结果
   *  @type {Array<any>} result 执行结果
   */
  result = [];
  /**
   *  @description 执行错误
   *  @type {Array<any>} errors 执行错误
   *  @example
   */
  errors = [];
  constructor(concurrency) {
    this.concurrency = concurrency;
  }

  /**
   *  @description 添加任务
   *  @param {Function} task 任务函数
   *  @example
   */
  async addTask(task) {
    if (typeof task !== 'function') {
      console.error('task must be a function', typeof task);
      return Promise.reject(new Error('task must be a function'));
    }
    return new Promise(async (rs, rj) => {
      const runTask = async () => {
        try {
          const res = await Promise.resolve().then(task);
          this.result.push(res);
          rs(res);
          return res;
        } catch (error) {
          this.errors.push(error);
          rj(error);
          return Promise.reject(error);
        }
      };
      this.pendingQueue.push(runTask);
      this._schedule();
    });
  }
  /**
   *  @description 执行任务
   */
  _schedule() {
    // 避免递归爆栈[4,8](@ref)
    setImmediate(() => {
      while (this.runningTask < this.concurrency && this.pendingQueue.length > 0) {
        this.runningTask++;
        const task = this.pendingQueue.shift();

        task().finally(() => {
          this.runningTask--;
          this._schedule(); // 异步递归调度

          // 所有任务完成时触发
          if (this.runningTask === 0 && this.pendingQueue.length === 0) {
            return Promise.resolve({
              result: this.result,
              errors: this.errors
            });
          }
        });
      }
    });
  }
  getResult() {
    return this.result;
  }

  getErrors() {
    return this.errors;
  }
}


const loop = new TaskLoop(2);


loop.addTask(() => {
  console.log(1);
});

loop.addTask(() => new Promise((resolve, reject) => {
  setTimeout(() => {
    reject(new Error('Async Error')); // 使用 reject 代替 throw
  }, 1000);
}));
// loop.addTask(() => { throw new Error('sync error'); });

function async1(num) {
  const task = () => {
    return new Promise((rs, rj) => {
      setTimeout(() => {
        console.log('async', num);
        rs(num);
      }, 1000);
    });
  }
  return task;
}
loop.addTask(async1(1));
loop.addTask(async1(2));
loop.addTask(async1(3));

loop.addTask(async1(4));
loop.addTask(async1(5));
loop.addTask(async1(6));

loop.addTask(() => console.log('should not run')).then(res => {
  // console.log(res);
}).catch(err => {
  // console.log(err);
}).finally(() => {
  console.log('finally');
  console.log(loop.getResult());
  console.log(loop.getErrors());
});