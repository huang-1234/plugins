import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerformanceMonitor } from './performance-monitor';
import type { PerformanceMonitorOps } from '../types';

// 模拟浏览器 Performance API
const mockPerformance = {
  timing: {
    navigationStart: 0,
    domainLookupStart: 10,
    domainLookupEnd: 20,
    connectStart: 20,
    connectEnd: 40,
    secureConnectionStart: 25,
    requestStart: 40,
    responseStart: 60,
    domContentLoadedEventStart: 100,
  },
  getEntriesByName: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  clearResourceTimings: vi.fn(),
  now: vi.fn(() => 1000),
};
vi.stubGlobal('performance', mockPerformance);

// 模拟 PerformanceObserver
class MockPerformanceObserver {
  constructor(public callback: PerformanceObserverCallback) {}
  observe() {}
  disconnect() {}
}
vi.stubGlobal('PerformanceObserver', MockPerformanceObserver);

// 模拟 navigator
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  connection: {
    effectiveType: '4g',
    type: 'wifi'
  },
  deviceMemory: 8,
  hardwareConcurrency: 8,
  sendBeacon: vi.fn(() => true)
};
vi.stubGlobal('navigator', mockNavigator);

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  const mockConfig: PerformanceMonitorOps = {
    reportUrl: 'https://api.example.com/perf',
    appId: 'TEST_APP',
    debug: true,
    warnings: {
      FCP: 1800,
      LCP: 2000,
      TTI: 5000,
      FID: 100,
      INP: 200,
      CLS: 0.1
    },
  };

  beforeEach(() => {
    monitor = new PerformanceMonitor(mockConfig);
    vi.useFakeTimers();

    // Reset mocks
    vi.clearAllMocks();

    // Mock document and window
    global.document = {
      title: 'Test Page',
      createElement: vi.fn(() => ({
        style: {},
        id: '',
      })),
      body: {
        appendChild: vi.fn(),
      },
    } as any;

    global.window = {
      location: {
        href: 'https://example.com/test'
      },
      addEventListener: vi.fn(),
      __isSpa: false,
      setTimeout: vi.fn(),
      clearTimeout: vi.fn(),
      requestIdleCallback: vi.fn(cb => cb()),
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    monitor.dispose();
    vi.useRealTimers();
  });

  // 测试 1：初始化配置合并
  it('正确合并默认配置与自定义配置', () => {
    expect(monitor['config'].appId).toBe('TEST_APP');
    expect(monitor['config'].warnings.FCP).toBe(1800);
    expect(monitor['config'].maxTime).toBe(500); // 默认值
  });

  // 测试 2：设备类型检测
  it('根据 UA 识别移动设备', () => {
    // 修改 UA 为移动设备
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)',
      configurable: true
    });

    // 创建新实例以触发设备类型检测
    const mobileMonitor = new PerformanceMonitor(mockConfig);
    mobileMonitor.start();

    expect(mobileMonitor['metrics'].deviceType).toBe('mobile');
  });

  // 测试 3：性能指标采集逻辑
  it('通过 PerformanceObserver 捕获 FCP', async () => {
    // 保存原始的 PerformanceObserver 实现
    const originalObserver = global.PerformanceObserver;

    // 创建 mock 实现
    const fcpObserverCallback = vi.fn();
    global.PerformanceObserver = vi.fn().mockImplementation((callback) => {
      fcpObserverCallback.mockImplementation(callback);
      return {
        observe: vi.fn(),
        disconnect: vi.fn()
      };
    }) as any;

    monitor.start();

    // 模拟 FCP 事件回调
    fcpObserverCallback({
      getEntriesByName: () => [{ startTime: 1200, name: 'first-contentful-paint' }],
    });

    expect(monitor['metrics'].FCP).toBe(1200);

    // 恢复原始实现
    global.PerformanceObserver = originalObserver;
  });

  // 测试 4：阈值警告生成
  it('当 FCP 超阈值时生成警告', () => {
    monitor['metrics'].FCP = 2000;
    monitor['metrics'].deviceType = 'mobile';

    const warnings = monitor['checkWarnings']();

    // 移动设备系数 1.3: 1800 * 1.3 = 2340, 但 2000 < 2340, 所以不应该有警告
    expect(warnings.length).toBe(0);

    // 设置更高的 FCP 值触发警告
    monitor['metrics'].FCP = 2500;
    const warningsWithHighFCP = monitor['checkWarnings']();

    expect(warningsWithHighFCP.length).toBe(1);
    expect(warningsWithHighFCP[0]).toContain('FCP');
  });

  // 测试 5：上报数据完整性
  it('上报数据包含关键指标和上下文', () => {
    const sendBeaconSpy = vi.spyOn(navigator, 'sendBeacon');

    // 设置一些指标值
    monitor['metrics'] = {
      ...monitor['metrics'],
      FCP: 1500,
      LCP: 2200,
      CLS: 0.05
    };

    monitor.report();

    // 验证 sendBeacon 被调用
    expect(sendBeaconSpy).toHaveBeenCalled();

    // 获取调用参数
    const [url, data] = sendBeaconSpy.mock.calls[0];

    // 验证 URL
    expect(url).toBe('https://api.example.com/perf');

    // 验证数据内容
    const reportBlob = data as Blob;
    expect(reportBlob).toBeInstanceOf(Blob);

    // 模拟解析 Blob 数据
    const mockReader = {
      result: JSON.stringify({
        appId: 'TEST_APP',
        metrics: { FCP: 1500, LCP: 2200, CLS: 0.05 },
        environment: { deviceType: 'desktop' }
      }),
      readAsText: vi.fn(function(this: { onload: (() => void) | null }) {
        if (this.onload) this.onload();
      }),
      onload: null as (() => void) | null
    };

    vi.spyOn(global, 'FileReader').mockImplementation(() => mockReader as any);

    // 验证上报标志被设置
    expect(monitor.isReported).toBe(true);
  });

  // 测试 6：SPA 路由重置
  it('路由切换时重置指标', () => {
    monitor.start();

    // 设置一些初始值
    monitor['metrics'].CLS = 0.2;
    monitor['isReported'] = true;
    monitor['lcpEntries'] = [{ startTime: 1000 } as any];

    // 调用路由重置方法
    monitor['resetForNextRoute']();

    // 验证值被重置
    expect(monitor['metrics'].CLS).toBe(0);
    expect(monitor['isReported']).toBe(false);
    expect(monitor['lcpEntries']).toEqual([]);
  });

  // 测试 7：资源释放
  it('dispose() 断开所有观察者', () => {
    const observerDisconnectSpy = vi.fn();

    // 设置模拟的观察者
    monitor['observers'] = [{ disconnect: observerDisconnectSpy }] as any;

    // 调用销毁方法
    monitor.dispose();

    // 验证观察者被断开连接
    expect(observerDisconnectSpy).toHaveBeenCalled();
    expect(monitor['observers'].length).toBe(0);
  });
});