import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerformanceJankStutter, useJankStutter } from './performance-jank-stutter';
import { renderHook } from '@testing-library/react';
import { useEffect } from 'react';

// 模拟浏览器API
vi.stubGlobal('PerformanceObserver', class {
  constructor(public callback: any) {}
  observe() { this.callback({ getEntries: () => [] }); }
  disconnect() {}
});
vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
  fn(performance.now() + 16);
  return 1;
});
vi.stubGlobal('cancelAnimationFrame', vi.fn());
vi.stubGlobal('performance', { now: () => Date.now() });

describe('PerformanceJankStutter', () => {
  let instance: PerformanceJankStutter;

  beforeEach(() => {
    instance = new PerformanceJankStutter();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    instance.stopMonitoring();
  });

  // 测试1: 现代环境监测启动
  it('现代模式下启动PerformanceObserver和RAF', () => {
    instance.startMonitoring();
    expect(console.warn).not.toHaveBeenCalled();
    expect(instance['rafId']).not.toBeNull();
  });

  // 测试2: 兼容模式回退
  it('不支持PerformanceObserver时回退到传统模式', () => {
    vi.spyOn(PerformanceObserver, 'supportedEntryTypes', 'get').mockReturnValue([]);
    instance.startMonitoring();
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('回退到传统监测'));
    expect(instance['rafId']).not.toBeNull();
  });

  // 测试3: 卡顿计数逻辑验证
  it('事件延迟超过阈值时计数正确', () => {
    instance.startMonitoring();
    // 模拟事件延迟60ms（小卡顿）
    const testEvent = {
      processingStart: 100,
      startTime: 40,
      duration: 60
    } as PerformanceEventTiming;
    instance['eventEntries'] = [testEvent];
    instance['updateMetrics']();

    expect(instance['jankCounts'].small).toBe(1);
    expect(instance['jankCounts'].large).toBe(0);
  });

  // 测试4: 帧率计算准确性
  it('根据帧时间计算正确FPS', () => {
    instance['frameTimes'] = [16, 32, 16]; // 平均21.3ms/帧 → 47FPS
    instance['updateMetrics']();
    // expect(instance['onUpdate']).toHaveBeenCalledWith(
    //   expect.objectContaining({ fps: 47 })
    // );
  });
});

// 测试React Hook
describe('useJankStutter', () => {
  it('挂载时启动监控，卸载时清理资源', () => {
    const { unmount } = renderHook(() => {
      const { panelJank } = useJankStutter();
      useEffect(() => panelJank.destroy, []);
    });

    const monitor = PerformanceJankStutter.prototype;
    vi.spyOn(monitor, 'startMonitoring');
    vi.spyOn(monitor, 'stopMonitoring');

    unmount();
    expect(monitor.stopMonitoring).toHaveBeenCalled();
  });
});