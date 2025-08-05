class DynamicPriorityTask {
  id: string;
  basePriority: number; // 基础优先级
  currentPriority: number; // 动态调整的优先级
  arrivalTime: number; // 任务到达时间
  executeTime: number = 0; // 实际执行时间
  status: 'pending' | 'running' | 'completed' = 'pending';

  constructor(id: string, basePriority: number) {
    this.id = id;
    this.basePriority = basePriority;
    this.currentPriority = basePriority;
    this.arrivalTime = Date.now();
  }

  // 动态更新优先级（核心逻辑）
  updatePriority(currentTime: number) {
    const waitingTime = currentTime - this.arrivalTime;

    // 动态提升逻辑：等待时间越长，优先级提升越大[1,3](@ref)
    const priorityBoost = Math.min(
      10, // 最大提升幅度（防饥饿机制）
      waitingTime * 0.005 // 等待时间系数（每毫秒提升0.005）
    );

    this.currentPriority = this.basePriority + priorityBoost;
  }
}

class DynamicPriorityScheduler {
  private queue: DynamicPriorityTask[] = [];
  private activeTask: DynamicPriorityTask | null = null;
  private concurrency: number;
  private starvationThreshold: number = 5000; // 饥饿判定阈值（5秒）

  constructor(concurrency: number = 1) {
    this.concurrency = concurrency;
  }

  // 添加任务（支持优先级）
  addTask(task: DynamicPriorityTask) {
    // 高优先级任务插队逻辑[2,4](@ref)
    if (task.currentPriority > this.queue[0]?.currentPriority) {
      this.queue.unshift(task);
    } else {
      this.queue.push(task);
    }
    this.schedule();
  }

  // 紧急任务插队方法
  addUrgentTask(task: DynamicPriorityTask) {
    console.log(`🚨 紧急任务插队: ${task.id} (优先级${task.basePriority})`);
    this.queue.unshift(task); // 直接插入队列头部
    this.schedule();
  }

  // 调度执行核心逻辑
  private schedule() {
    // 跳过已有正在执行的任务
    if (this.activeTask || this.queue.length === 0) return;

    // 更新所有任务优先级[3](@ref)
    const now = Date.now();
    this.queue.forEach(task => task.updatePriority(now));

    // 按动态优先级排序（数值越大优先级越高）
    this.queue.sort((a, b) => b.currentPriority - a.currentPriority);

    // 检查任务饥饿状态[3](@ref)
    const starvedTask = this.queue.find(task =>
      (now - task.arrivalTime) > this.starvationThreshold
    );

    if (starvedTask) {
      console.log(`⚠️ 任务饥饿提升: ${starvedTask.id} 等待${now - starvedTask.arrivalTime}ms`);
      starvedTask.currentPriority = 10; // 饥饿任务提升至最高优先级
      this.queue.sort((a, b) => b.currentPriority - a.currentPriority);
    }

    // 执行最高优先级任务
    this.activeTask = this.queue.shift()!;
    this.activeTask.status = 'running';
    this.activeTask.executeTime = now;

    console.log(`▶️ 执行任务: ${this.activeTask.id} | ` +
      `动态优先级: ${this.activeTask.currentPriority.toFixed(2)} | ` +
      `等待时间: ${now - this.activeTask.arrivalTime}ms`);

    // 模拟任务执行（实际应用替换为真实逻辑）
    setTimeout(() => this.completeTask(), 1000);
  }

  private completeTask() {
    if (!this.activeTask) return;

    console.log(`✅ 完成任务: ${this.activeTask.id}`);
    this.activeTask.status = 'completed';
    this.activeTask = null;
    this.schedule(); // 继续调度
  }

  // 获取队列状态（调试用）
  getQueueStatus() {
    return this.queue.map(task => ({
      id: task.id,
      priority: task.currentPriority.toFixed(2),
      waiting: Date.now() - task.arrivalTime
    }));
  }
}

// #######################
// 使用示例
// #######################

const scheduler = new DynamicPriorityScheduler(1); // 单线程调度

// 添加初始任务
scheduler.addTask(new DynamicPriorityTask('T1', 3)); // 中优先级
scheduler.addTask(new DynamicPriorityTask('T2', 1)); // 低优先级
scheduler.addTask(new DynamicPriorityTask('T3', 2)); // 中低优先级

// 添加高优先级任务（正常添加）
setTimeout(() => {
  scheduler.addTask(new DynamicPriorityTask('T4', 5)); // 高优先级
}, 1500);

// 添加紧急任务（插队执行）
setTimeout(() => {
  const urgentTask = new DynamicPriorityTask('URGENT', 1);
  urgentTask.basePriority = 8; // 提升基础优先级
  scheduler.addUrgentTask(urgentTask);
}, 3000);

// 添加饥饿任务演示
setTimeout(() => {
  const longTask = new DynamicPriorityTask('STARVED', 1);
  scheduler.addTask(longTask);

  // 10秒后查看饥饿任务状态
  setTimeout(() => console.log('饥饿任务状态:', scheduler.getQueueStatus()), 10000);
}, 500);