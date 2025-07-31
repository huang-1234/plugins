// 基本使用示例
import { PerformanceMonitor, PerformanceJankStutter } from 'performance-monitor';

// 创建性能监控实例
const monitor = new PerformanceMonitor({
  appId: 'example-app',
  debug: true,
  isDev: true,
  deviceType: 'auto',
  warnings: {
    FCP: 1800,   // 首次内容绘制阈值 (ms)
    LCP: 2500,   // 最大内容绘制阈值 (ms)
    TTI: 3500,   // 可交互时间阈值 (ms)
    FID: 100,    // 首次输入延迟阈值 (ms)
    INP: 200,    // 交互到下一次绘制阈值 (ms)
    CLS: 0.1,    // 累积布局偏移阈值
  },
  pageInfo: {
    pageUrl: window.location.href,
    pageTitle: document.title,
    routeId: 'home-page',
  }
});

// 创建帧率监控实例
const jankMonitor = new PerformanceJankStutter({
  updateInterval: 1000, // 每秒更新一次
  minJankThreshold: 50, // 小卡顿阈值 (ms)
  largeJankThreshold: 100 // 大卡顿阈值 (ms)
});

// 启动监控
monitor.start();
jankMonitor.startMonitoring();

// 设置帧率监控回调
jankMonitor.onUpdate = (data) => {
  console.log('性能数据更新:', {
    fps: data.fps,
    jankCounts: {
      small: data.jank.small,
      medium: data.jank.medium,
      large: data.jank.large
    },
    stutterRate: data.jank.stutterRate,
    eventDelay: data.eventTiming?.avgDelay
  });

  // 更新UI显示
  updatePerformanceUI(data);
};

// 在页面加载完成后生成性能报告
window.addEventListener('load', () => {
  setTimeout(() => {
    monitor.report();
  }, 3000);
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
  monitor.dispose();
  jankMonitor.stopMonitoring();
});

// 更新UI显示的函数（示例）
function updatePerformanceUI(data) {
  const performancePanel = document.getElementById('performance-panel');
  if (!performancePanel) return;

  performancePanel.innerHTML = `
    <div>FPS: ${data.fps}</div>
    <div>卡顿率: ${(data.jank.stutterRate * 100).toFixed(2)}%</div>
    <div>小卡顿: ${data.jank.small}</div>
    <div>中卡顿: ${data.jank.medium}</div>
    <div>大卡顿: ${data.jank.large}</div>
    ${data.eventTiming ? `<div>平均事件延迟: ${data.eventTiming.avgDelay.toFixed(2)}ms</div>` : ''}
  `;
}