import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerformanceMonitor, PerformanceJankStutter } from '../index';

// 模拟浏览器环境
const mockPerformanceObserver = vi.fn();
const mockDisconnect = vi.fn();

// 模拟性能API
const mockPerformance = {
  now: () => 1000,
  getEntriesByType: () => [],
  getEntriesByName: () => [],
  timing: {
    navigationStart: 0,
    domainLookupStart: 10,
    domainLookupEnd: 20,
    connectStart: 30,
    connectEnd: 40,
    secureConnectionStart: 35,
    requestStart: 50,
    responseStart: 100,
    domContentLoadedEventStart: 200
  }
};

describe('Rollup构建测试', () => {
  beforeEach(() => {
    // 设置模拟
    global.PerformanceObserver = mockPerformanceObserver.mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: mockDisconnect
    }));

    global.performance = mockPerformance as any;
    global.window = {
      location: { href: 'https://example.com' },
      document: { title: 'Test Page' }
    } as any;

    // 重置模拟
    mockDisconnect.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该能够创建PerformanceMonitor实例', () => {
    const monitor = new PerformanceMonitor({
      appId: 'test',
      reportUrl: '',
      warnings: {
        FCP: 1000,
        LCP: 2500,
        TTI: 5000,
        FID: 100,
        INP: 200,
        CLS: 0.1
      }
    });

    expect(monitor).toBeDefined();
    expect(typeof monitor.start).toBe('function');
    expect(typeof monitor.report).toBe('function');
    expect(typeof monitor.dispose).toBe('function');
  });

  it('应该能够创建PerformanceJankStutter实例', () => {
    const jankMonitor = new PerformanceJankStutter();

    expect(jankMonitor).toBeDefined();
    expect(typeof jankMonitor.startMonitoring).toBe('function');
    expect(typeof jankMonitor.stopMonitoring).toBe('function');
  });

  it('应该能够启动和停止监控', () => {
    const monitor = new PerformanceMonitor({
      appId: 'test',
      reportUrl: '',
      warnings: {
        FCP: 1000,
        LCP: 2500,
        TTI: 5000,
        FID: 100,
        INP: 200,
        CLS: 0.1
      }
    });

    monitor.start();
    expect(monitor.isStarted).toBe(true);

    monitor.dispose();
    expect(monitor.isStopped).toBe(true);
  });
});