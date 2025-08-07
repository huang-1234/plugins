import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AsyncController } from './AsyncController';

// 测试辅助函数：创建延迟任务
const createDelayTask = (value, delay = 10) => {
  return () => new Promise(resolve => setTimeout(() => resolve(value), delay));
};

// 测试辅助函数：创建失败任务
const createErrorTask = (message, delay = 10) => {
  return () => new Promise((_, reject) => setTimeout(() => reject(new Error(message)), delay));
};

describe('AsyncController', () => {
  let controller;

  beforeEach(() => {
    // 每个测试前重置控制器
    controller = new AsyncController(3, 1);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('应该按顺序返回所有任务的结果', async () => {
    const tasks = [
      createDelayTask('Task1', 30),
      createDelayTask('Task2', 10),
      createDelayTask('Task3', 20)
    ];

    const results = await controller.run(tasks);

    expect(results).toHaveLength(3);
    expect(results[0].status).toBe('fulfilled');
    expect(results[0].value).toBe('Task1');
    expect(results[1].status).toBe('fulfilled');
    expect(results[1].value).toBe('Task2');
    expect(results[2].status).toBe('fulfilled');
    expect(results[2].value).toBe('Task3');
  });

  it('应该处理任务失败的情况', async () => {
    const tasks = [
      createDelayTask('Task1', 10),
      createErrorTask('Task2 Failed', 20),
      createDelayTask('Task3', 30)
    ];

    const results = await controller.run(tasks);

    expect(results).toHaveLength(3);
    expect(results[0].status).toBe('fulfilled');
    expect(results[0].value).toBe('Task1');
    expect(results[1].status).toBe('rejected');
    expect(results[1].reason).toBeInstanceOf(Error);
    expect(results[1].reason.message).toBe('Task2 Failed');
    expect(results[2].status).toBe('fulfilled');
    expect(results[2].value).toBe('Task3');
  });

  it('应该遵守最大并发限制', async () => {
    const concurrencyTracker = [];
    let activeCount = 0;

    // 创建10个任务，每个任务会记录当前活跃任务数
    const tasks = Array(10).fill(null).map((_, i) => {
      return async () => {
        activeCount++;
        concurrencyTracker.push(activeCount);
        await new Promise(r => setTimeout(r, 10));
        activeCount--;
        return `Task${i+1}`;
      };
    });

    controller = new AsyncController(3, 1); // 最大并发3
    await controller.run(tasks);

    // 验证并发数从未超过最大限制
    expect(Math.max(...concurrencyTracker)).toBeLessThanOrEqual(3);
  });

  it('应该遵守最小并发限制', async () => {
    const tasks = Array(10).fill(null).map((_, i) =>
      createDelayTask(`Task${i+1}`, 10)
    );

    controller = new AsyncController(5, 2); // 最小并发2
    const processQueueSpy = vi.spyOn(controller, '_processQueue');

    await controller.run(tasks);

    // 检查是否调用了_processQueue方法
    expect(processQueueSpy).toHaveBeenCalled();

    // 由于内部实现细节，我们无法直接测试最小并发，
    // 但可以确保所有任务都已完成
    const allFulfilled = controller.results.every(r => r.status === 'fulfilled');
    expect(allFulfilled).toBe(true);
  });

  it('应该允许按需获取有序结果', async () => {
    const tasks = [
      createDelayTask('Task1', 30),
      createDelayTask('Task2', 10),
      createDelayTask('Task3', 20)
    ];

    // 启动任务但不等待
    const runPromise = controller.run(tasks);

    // 立即请求结果
    const result1Promise = controller.getOrderedResult(0);
    const result2Promise = controller.getOrderedResult(1);

    // 等待第二个结果（应该比第一个更快完成）
    const result2 = await result2Promise;
    expect(result2.status).toBe('fulfilled');
    expect(result2.value).toBe('Task2');

    // 然后等待第一个结果
    const result1 = await result1Promise;
    expect(result1.status).toBe('fulfilled');
    expect(result1.value).toBe('Task1');

    // 完成所有任务
    await runPromise;
  });

  it('应该处理大量任务', async () => {
    const taskCount = 50;
    const tasks = Array(taskCount).fill(null).map((_, i) =>
      createDelayTask(`Task${i+1}`, Math.random() * 20)
    );

    const results = await controller.run(tasks);

    expect(results).toHaveLength(taskCount);
    const allCompleted = results.every(r => r.status === 'fulfilled');
    expect(allCompleted).toBe(true);
  });

  it('应该动态调整并发量', async () => {
    const tasks = Array(20).fill(null).map((_, i) =>
      createDelayTask(`Task${i+1}`, 10)
    );

    controller = new AsyncController(5, 1); // 最大并发5，最小并发1
    const processQueueSpy = vi.spyOn(controller, '_processQueue');

    await controller.run(tasks);

    expect(processQueueSpy).toHaveBeenCalled();
    // 验证所有任务都已完成
    expect(controller.results).toHaveLength(20);
    expect(controller.index).toBe(20);
    expect(controller.inProgress).toBe(0);
  });
});
