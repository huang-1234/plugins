// 基本使用示例
import { PerformanceMonitor } from '../dist/index.mjs';

// 创建监控实例
const monitor = new PerformanceMonitor({
  appId: 'example-app',
  reportUrl: '/api/performance',
  debug: true,
  isDev: true,
  deviceType: 'auto',
  warnings: {
    FCP: 2000,
    LCP: 2500,
    TTI: 5000,
    FID: 100,
    INP: 200,
    CLS: 0.1,
  },
  pageInfo: {
    pageUrl: window.location.href,
    pageTitle: document.title,
    routeId: 'home-page'
  }
});

// 启动监控
monitor.start();

// 5秒后报告性能数据
setTimeout(() => {
  monitor.report();
  console.log('Performance metrics:', monitor.metrics);
}, 5000);

// 页面卸载时自动报告
window.addEventListener('beforeunload', () => {
  monitor.report();
});