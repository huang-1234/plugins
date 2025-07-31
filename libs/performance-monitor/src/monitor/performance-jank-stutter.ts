import { PanelJank } from './panel-jank';
/* eslint-disable no-unsafe-optional-chaining */
import type { PanelJankOps } from './panel-jank';
import { PerformanceBase } from './performance-base';
import type { PerformancePanelMetrics } from '../types';
import { useEffect } from 'react';

const jankCountsDefault = { small: 0, medium: 0, large: 0 };

export interface JankStutterOptions {
  /**
   * 帧率
   * 默认16.67，单位：ms
   */
  frame?: number;
  /**
   * 设备刷新率
   * 默认60，单位：Hz
   */
  deviceRefreshRate?: number;
  /**
   * 事件处理延迟阈值（小卡顿）
   * 默认50ms
   */
  minJankThreshold?: number;
  /**
   * 事件处理延迟阈值（大卡顿）
   * 默认100ms
   */
  largeJankThreshold?: number;
  /**
   * 数据更新间隔
   * 默认1000ms
   */
  updateInterval?: number;
}

// 动态阈值计算（兼容旧的检测方法）
const isJank = (currentTime: number, prevTimes: number[]) => {
  const avgPrev = prevTimes?.slice(-3)?.reduce?.((a, b) => a + b, 0) / 3;
  return currentTime > Math.max(83, avgPrev * 2);
};

// 大卡顿检测（兼容旧的检测方法）
const isBigJank = (currentTime: number) => currentTime > 125;

export class PerformanceJankStutter extends PerformanceBase {
  private frameTimes: number[] = [];
  private jankCounts = jankCountsDefault;
  /** 帧率 */
  public frame: number;
  /** 设备刷新率 */
  public deviceRefreshRate: number;
  /** 事件延迟阈值（小卡顿）*/
  public minJankThreshold: number;
  /** 事件延迟阈值（大卡顿）*/
  public largeJankThreshold: number;
  /** 数据更新间隔 */
  public updateInterval: number;
  /** 性能观察器 */
  private performanceObserver: PerformanceObserver | null = null;
  /** 定时更新器 */
  private updateTimer: number | null = null;
  /** 收集的事件数据 */
  private eventEntries: PerformanceEventTiming[] = [];
  /** RAF ID */
  private rafId: number | null = null;

  constructor(ops: JankStutterOptions = {}) {
    super();
    this.frameTimes = [];
    this.jankCounts = jankCountsDefault;
    this.deviceRefreshRate = ops.deviceRefreshRate || 60;
    this.frame = ops.frame || 1000 / this.deviceRefreshRate || 16.67;
    this.minJankThreshold = ops.minJankThreshold || 50;
    this.largeJankThreshold = ops.largeJankThreshold || 100;
    this.updateInterval = ops.updateInterval || 1000;
  }

  startMonitoring() {
    // 检查浏览器是否支持 PerformanceObserver 和 Event Timing API
    if (
      typeof PerformanceObserver !== 'undefined' &&
      PerformanceObserver?.supportedEntryTypes?.includes?.('event')
    ) {
      this.startEventTimingMonitor();
      console.log('PerformanceObserver 初始化成功, start monitor');

      // 同时保留基于 RAF 的帧率监测，用于计算 FPS
      this.startFrameRateMonitor();
    } else {
      // 回退到传统的 RAF 监测方式
      console.warn('PerformanceObserver 初始化失败，回退到传统监测');
      this.startLegacyMonitor();
    }
  }

  /**
   * 启动基于 PerformanceObserver 的事件计时监测
   */
  private startEventTimingMonitor() {
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];

        // 收集事件数据
        this.eventEntries.push(...entries);

        // 处理事件延迟数据
        entries.forEach((entry) => {
          // 事件处理延迟时间
          const eventDelay = entry.processingStart - entry.startTime;
          // 事件处理时间
          const processingTime = entry.processingEnd - entry.processingStart;
          /**
           * @TODO:
           * @desc 总响应时间
           */
          // const totalDuration = entry.duration;

          // 卡顿检测
          if (eventDelay > this.minJankThreshold) {
            this.jankCounts.small++;
          }
          if (eventDelay > this.largeJankThreshold) {
            this.jankCounts.large++;
          }
          // 中等卡顿（事件处理时间过长）
          if (processingTime > this.minJankThreshold && processingTime <= this.largeJankThreshold) {
            this.jankCounts.medium++;
          }
        });
      });

      // 开始观察事件计时
      this.performanceObserver.observe({ type: 'event', buffered: true });

      // 设置定时更新
      this.updateTimer = window.setInterval(() => {
        this.updateMetrics();
      }, this.updateInterval);
    } catch (error) {
      console.warn('PerformanceObserver初始化失败，回退到传统监测:', error);
      this.startLegacyMonitor();
    }
  }

  /**
   * 启动基于 RAF 的帧率监测
   */
  private startFrameRateMonitor() {
    let lastFrameTime = performance.now();

    const checkFrame = (timestamp: DOMHighResTimeStamp) => {
      const delta = timestamp - lastFrameTime;

      // 帧率计算（滑动窗口）
      this.frameTimes.push(delta);
      if (this.frameTimes.length > 60) this.frameTimes.shift();
      lastFrameTime = timestamp;
      this.rafId = requestAnimationFrame(checkFrame);
    };

    this.rafId = requestAnimationFrame(checkFrame);
  }

  /**
   * 传统的卡顿监测方式（兼容性保障）
   */
  private startLegacyMonitor() {
    let lastFrameTime = performance.now();
    let lastUpdateTime = 0;

    const checkFrame = (timestamp: DOMHighResTimeStamp) => {
      const delta = timestamp - lastFrameTime;

      // 1. 帧率计算（滑动窗口）
      this.frameTimes.push(delta);
      if (this.frameTimes.length > 60) this.frameTimes.shift();

      // 2. 卡顿检测（基于Google Vitals标准）
      const prevTimes = this.frameTimes.slice(-3);
      if (isJank(delta, prevTimes)) this.jankCounts.small++;
      if (isBigJank(delta)) this.jankCounts.large++;

      // 3. 通过Worker传输聚合数据
      if (timestamp - lastUpdateTime > this.updateInterval) {
        this.updateMetrics();
        lastUpdateTime = timestamp;
      }

      lastFrameTime = timestamp;
      this.rafId = requestAnimationFrame(checkFrame);
    };

    this.rafId = requestAnimationFrame(checkFrame);
  }

  /**
   * 更新并发送性能指标
   */
  private updateMetrics() {
    // 计算 FPS
    const fps =
      this.frameTimes.length > 0
        ? Math.round(
            1000 / (this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length),
          )
        : this.deviceRefreshRate;

    // 计算卡顿率
    let stutterDuration = 0;
    this.frameTimes.forEach((t) => {
      const overflow = t - this.frame;
      stutterDuration += overflow > 0 ? overflow : 0;
    });
    const stutterRate =
      this.frameTimes.length > 0 ? stutterDuration / (this.frameTimes.length * this.frame) : 0;

    // 计算严重卡顿率
    const severeJankRate =
      this.frameTimes.length > 0
        ? this.frameTimes?.filter((t) => t > 100)?.length / this.frameTimes.length
        : 0;

    // 事件响应延迟（基于PerformanceObserver）
    let avgEventDelay = 0;
    let maxEventDelay = 0;
    if (this.eventEntries.length > 0) {
      const delays = this.eventEntries.map((entry) => entry.processingStart - entry.startTime);
      avgEventDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length;
      maxEventDelay = Math.max(...delays);

      // 清空事件缓存，避免内存泄漏
      this.eventEntries = [];
    }
    // 更新数据
    const metrics: PerformancePanelMetrics = {
      fps,
      jank: {
        small: this.jankCounts.small,
        medium: this.jankCounts.medium,
        large: this.jankCounts.large,
        stutterRate,
        severeJankRate,
      },
      frameTimes: [...this.frameTimes],
      // 添加事件响应指标
      eventTiming: {
        avgDelay: avgEventDelay,
        maxDelay: maxEventDelay,
      },
    };

    // 调用回调函数
    if (this.onUpdate) {
      this.onUpdate(metrics);
    }

    // 通过Worker传输
    this.postToWorker({
      type: 'calculateJank',
      data: {
        fps,
        jankCounts: this.jankCounts,
        stutterRate,
        severeJankRate,
        eventTiming: {
          avgDelay: avgEventDelay,
          maxDelay: maxEventDelay,
        },
      },
    });

    // 重置计数器
    this.jankCounts = { ...jankCountsDefault };
  }

  stopMonitoring() {
    // 停止 PerformanceObserver
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    // 清除定时器
    if (this.updateTimer !== null) {
      window.clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    // 停止 RAF
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // 清除数据
    this.frameTimes = [];
    this.jankCounts = jankCountsDefault;
    this.eventEntries = [];
  }
}

export function useJankStutter(opsJank: JankStutterOptions = {}, opsPanel: PanelJankOps = {}) {
  const jankMonitor = new PerformanceJankStutter(opsJank);
  const panelJank = new PanelJank(opsPanel);
  useEffect(() => {
    // 连接监控和面板
    jankMonitor.onUpdate = (data: PerformancePanelMetrics) => {
      panelJank.updateMetrics(data);
    };

    jankMonitor.startMonitoring();
    return () => {
      jankMonitor.stopMonitoring();
      panelJank.destroy();
    };
  }, []);

  return {
    panelJank,
  };
}
