import React, { useEffect } from 'react';
import { PerformanceMonitor, PerformanceJankStutter } from '../dist/index.mjs';

// React组件示例
function PerformanceMonitoring() {
  useEffect(() => {
    // 1. 页面性能指标监控
    const performanceMonitor = new PerformanceMonitor({
      appId: 'react-app',
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
        routeId: 'react-page'
      }
    });

    performanceMonitor.start();

    // 2. 卡顿监控
    const jankMonitor = new PerformanceJankStutter({
      updateInterval: 1000,
      minJankThreshold: 50,
      largeJankThreshold: 100
    });

    jankMonitor.onUpdate = (data) => {
      console.log('Jank metrics:', data);
    };

    jankMonitor.startMonitoring();

    // 清理函数
    return () => {
      performanceMonitor.dispose();
      jankMonitor.stopMonitoring();
    };
  }, []);

  return (
    <div>
      <h1>Performance Monitoring Active</h1>
      <p>Check the console for performance metrics.</p>
    </div>
  );
}

export default PerformanceMonitoring;