// React使用示例
import React, { useEffect, useState } from 'react';
import { PerformanceMonitor, useJankStutter } from 'performance-monitor';

// 性能监控组件
function PerformanceMonitorComponent() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // 创建性能监控实例
    const monitor = new PerformanceMonitor({
      appId: 'react-app',
      debug: true,
      isDev: process.env.NODE_ENV !== 'production',
      deviceType: 'auto',
      warnings: {
        FCP: 1800,
        LCP: 2500,
        TTI: 3500,
        FID: 100,
        INP: 200,
        CLS: 0.1,
      },
      pageInfo: {
        pageUrl: window.location.href,
        pageTitle: document.title,
        routeId: 'dashboard',
      }
    });

    // 启动监控
    monitor.start();

    // 定期更新指标
    const intervalId = setInterval(() => {
      setMetrics({...monitor.metrics});
    }, 1000);

    // 清理函数
    return () => {
      clearInterval(intervalId);
      monitor.dispose();
    };
  }, []);

  if (!metrics) {
    return <div>加载性能数据中...</div>;
  }

  return (
    <div className="performance-metrics">
      <h3>Web性能指标</h3>
      <div className="metrics-grid">
        <MetricItem label="FCP" value={metrics.FCP} unit="ms" />
        <MetricItem label="LCP" value={metrics.LCP} unit="ms" />
        <MetricItem label="TTI" value={metrics.TTI} unit="ms" />
        <MetricItem label="FID" value={metrics.FID} unit="ms" />
        <MetricItem label="INP" value={metrics.INP} unit="ms" />
        <MetricItem label="CLS" value={metrics.CLS?.toFixed(4)} />
      </div>
    </div>
  );
}

// 帧率监控组件
function JankMonitorComponent() {
  const [jankData, setJankData] = useState(null);

  // 使用自定义Hook
  const { panelJank } = useJankStutter({
    updateInterval: 1000
  });

  useEffect(() => {
    // 设置更新回调
    const originalUpdate = panelJank.updateMetrics;

    panelJank.updateMetrics = (data) => {
      setJankData(data);
      originalUpdate.call(panelJank, data);
    };

    return () => {
      // 恢复原始方法
      panelJank.updateMetrics = originalUpdate;
    };
  }, [panelJank]);

  if (!jankData) {
    return <div>加载帧率数据中...</div>;
  }

  return (
    <div className="jank-metrics">
      <h3>帧率与卡顿</h3>
      <div className="metrics-grid">
        <MetricItem label="FPS" value={jankData.fps} />
        <MetricItem
          label="卡顿率"
          value={(jankData.jank.stutterRate * 100).toFixed(2)}
          unit="%"
          warning={jankData.jank.stutterRate > 0.1}
        />
        <MetricItem
          label="小卡顿"
          value={jankData.jank.small}
        />
        <MetricItem
          label="中卡顿"
          value={jankData.jank.medium}
        />
        <MetricItem
          label="大卡顿"
          value={jankData.jank.large}
          warning={jankData.jank.large > 0}
        />
        {jankData.eventTiming && (
          <MetricItem
            label="事件延迟"
            value={jankData.eventTiming.avgDelay.toFixed(2)}
            unit="ms"
            warning={jankData.eventTiming.avgDelay > 50}
          />
        )}
      </div>
    </div>
  );
}

// 指标项组件
function MetricItem({ label, value, unit = '', warning = false }) {
  return (
    <div className={`metric-item ${warning ? 'warning' : ''}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        {value !== undefined && value !== null ? `${value}${unit}` : '未测量'}
      </div>
    </div>
  );
}

// 完整的性能监控面板
export function PerformancePanel() {
  return (
    <div className="performance-panel">
      <PerformanceMonitorComponent />
      <JankMonitorComponent />
    </div>
  );
}