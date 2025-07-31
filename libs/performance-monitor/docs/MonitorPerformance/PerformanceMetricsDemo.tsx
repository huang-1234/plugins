import { Button, message } from 'antd';

import { PerformanceMonitor } from '../../src';
import React from 'react';

const PerformanceMetricsDemo = () => {

  React.useEffect(() => {
    const monitor = new PerformanceMonitor({ // 创建监控实例并启动
      appId: "MOBILE_DEMO",
      debug: true,
      reportUrl: '', // 实际使用时配置真实API
      warnings: {
        FCP: 1800,
        LCP: 2000,
        TTI: 5000,
        FID: 80,
        CLS: 0.12,
        INP: 200,
      },
      maxTime: 30000,
      isDev: true,
      pageInfo: {
        pageUrl: window?.location?.href || '',
        pageTitle: document?.title || '',
      },
    });

    monitor.start();

    function report() {
      if (!monitor.report) {
        monitor.report();
      }
    }

    // 模拟在页面准备完成后报告性能数据
    window.addEventListener("load", () => {
      // 在实际SPA应用中，可在路由切换时调用report()
      setTimeout(report, 3000);
    });

    return () => {
      monitor.dispose();
      window.removeEventListener("load", report);
    };
  }, []);

  return (
    <div>
      <Button
        type="primary"
        onClick={async () => {
          const performanceMonitor = new PerformanceMonitor({
            warnings: {
              FCP: 1800,
              LCP: 2000,
              TTI: 5000,
              FID: 80,
              CLS: 0.12,
              INP: 200,
            },
            reportUrl: '',
            appId: 'MOBILE_DEMO',
            debug: true,
            isDev: true,
            maxTime: 30000,
            deviceType: 'auto',
            networkType: 'unknown',
          });
          performanceMonitor.start();
          message.info('开始监控');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          message.success('过了1秒');
          await new Promise((resolve) => setTimeout(resolve, 3000));
          message.success('又过了3秒');
          performanceMonitor.dispose();
        }}
      >
        点击一下
      </Button>
    </div>
  );
};

export default PerformanceMetricsDemo;
