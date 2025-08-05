# 任务调度器


## 问题
- 并发控制失效
- 任务执行顺序错误
- 任务状态管理缺失
- 错误处理缺陷

### 问题分析与测试案例

#### **1. 并发控制失效**
- **问题**：`push` 方法中的 `while` 循环会持续将任务加入 `currentTask`，直到 `allTask` 清空，导致所有任务立即启动，忽略 `execMaxNum` 限制。
- **测试案例**：
  ```javascript
  const loop = new TaskLoop(2);
  loop.push(() => new Promise(rs => setTimeout(() => { console.log('Task1'); rs(); }, 1000)));
  loop.push(() => new Promise(rs => setTimeout(() => { console.log('Task2'); rs(); }, 1000)));
  loop.push(() => new Promise(rs => setTimeout(() => { console.log('Task3'); rs(); }, 1000)));
  ```
  **预期**：仅同时执行 2 个任务（`Task1`、`Task2`），1 秒后执行 `Task3`。
  **实际**：所有任务同时启动（输出时间相同）。

---

#### **2. 任务执行顺序错误**
- **问题**：`exec` 方法使用 `shift()` 按序执行 `currentTask`，但同步任务会阻塞异步任务，导致顺序混乱。
- **测试案例**：
  ```javascript
  const loop = new TaskLoop(1);
  loop.push(() => new Promise(rs => setTimeout(() => { console.log('1'); rs(); }, 1000)));
  loop.push(() => console.log('2')); // 同步任务
  loop.push(() => console.log('3'));
  ```
  **预期**：输出顺序 `1 → 2 → 3`。
  **实际**：输出 `2 → 3 → 1`（同步任务优先执行）。

---

#### **3. 任务状态管理缺失**
- **问题**：
  - `currentTask` 数组在任务启动后未清理，导致计数错误。
  - 缺少任务完成通知机制（如 `Promise`），调用方无法感知任务结束。
- **测试案例**：
  ```javascript
  const loop = new TaskLoop(1);
  loop.push(() => new Promise(rs => setTimeout(rs, 1000)));
  // 无法得知任务何时完成
  ```

---

#### **4. 错误处理缺陷**
- **问题**：`try-catch` 只能捕获同步错误，无法捕获异步错误（如 `setTimeout` 中的异常）。
- **测试案例**：
  ```javascript
  loop.push(() => new Promise(() => {
    setTimeout(() => { throw new Error('Async Error'); }, 1000);
  }));
  ```
  **结果**：未捕获错误，进程崩溃。

---

### 修复方案与代码实现

#### **核心修复点**
1. **并发控制**：
   - 用 `pendingQueue`（等待队列）和 `runningCount`（运行计数）替代 `currentTask`。
   - 任务完成后触发 `_next()` 启动新任务。
2. **任务状态管理**：
   - 返回 `Promise` 供调用方等待任务完成。
3. **错误处理**：
   - 用 `async/await` + `try-catch` 捕获同步/异步错误。

#### **修复后代码**
```javascript
class TaskLoop {
  constructor(concurrency) {
    this.concurrency = concurrency;
    this.pendingQueue = [];     // 等待队列
    this.running = 0;           // 运行中任务数
    this.results = [];          // 成功结果
    this.errors = [];           // 错误信息
    this.finished = null;        // 完成通知Promise
    this.resolveFinished = null; // 完成通知Resolver
    this.finished = new Promise((rs) => {
      this.resolveFinished = rs;
    });
  }

  /**
   * 添加任务
   * @param {Function} task 任务函数（需返回Promise）
   * @returns {Promise} 任务完成通知
   */
  add(task) {
    return new Promise((resolve, reject) => {
      // 包装任务以捕获结果/错误
      const wrappedTask = async () => {
        try {
          const result = await task();
          this.results.push(result);
          resolve(result);
          return result;
        } catch (err) {
          this.errors.push(err);
          reject(err);
          throw err;
        }
      };

      this.pendingQueue.push(wrappedTask);
      this._next(); // 尝试启动任务
    });
  }

  /** 内部方法：执行下一个任务 */
  _next() {
    // 所有任务完成时触发通知
    if (this.running === 0 && this.pendingQueue.length === 0) {
      this.resolveFinished({ results: this.results, errors: this.errors });
      return;
    }

    // 启动新任务（不超过并发数）
    while (this.running < this.concurrency && this.pendingQueue.length > 0) {
      const task = this.pendingQueue.shift();
      this.running++;
      task()
        .finally(() => {
          this.running--;
          this._next(); // 递归检查后续任务
        });
    }
  }

  /** 等待所有任务完成 */
  wait() {
    return this.finished;
  }
}
```

---

### 社区方案对比与优化建议
#### **1. 社区成熟方案**
- **信号量控制**（如 `SemaphoreSlim`）：
  通过计数器精准限制并发数，避免资源耗尽。
- **Goroutine 池**（Go 风格）：
  使用 Channel 分发任务，固定 Worker 数量处理任务。
- **线程池优化**（如 `ThreadPoolExecutor`）：
  动态调整线程数，避免上下文切换开销。

#### **2. 最终优化代码**
结合信号量机制和任务队列，实现高并发控制：
```javascript
import { Semaphore } from 'async-mutex'; // 使用信号量库

class TaskPool {
  constructor(concurrency) {
    this.semaphore = new Semaphore(concurrency);
    this.tasks = [];
    this.results = [];
    this.errors = [];
  }

  async add(task) {
    const [release] = await this.semaphore.acquire();
    try {
      const result = await task();
      this.results.push(result);
      return result;
    } catch (err) {
      this.errors.push(err);
      throw err;
    } finally {
      release();
    }
  }
}
```

#### **3. 关键优化点**
1. **信号量替代手动计数**：
   - 避免并发超限和资源竞争。
2. **任务与执行解耦**：
   - 分离任务队列和 Worker 逻辑（类似 Goroutine 池）。
3. **错误边界隔离**：
   - 单个任务失败不影响整体执行。

---

### 总结
- **原代码问题**：并发失控、状态管理缺失、错误处理不足。
- **修复核心**：队列 + 计数器 + 递归调度（`_next()`）。
- **生产级方案**：信号量（`Semaphore`）或固定 Worker 池（Channel 模式）。

> 通过任务队列和状态机管理，可稳定支持高并发场景（如 I/O 密集型请求）。参考实现：https://github.com/sindresorhus/p-limit（信号量实现）或 https://github.com/rxaviers/async-pool（队列+Promise 控制）。