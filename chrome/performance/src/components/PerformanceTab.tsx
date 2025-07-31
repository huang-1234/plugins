import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PerformanceMonitor } from 'perfor-monitor';
import { PerformanceJankStutter } from 'perfor-monitor';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PerformanceMonitorMetrics, PerformancePanelMetrics } from 'perfor-monitor';

const TabContainer = styled.div`
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  margin-top: 0;
  margin-bottom: 16px;
  color: #333;
  font-size: 18px;
`;

const SectionTitle = styled.h3`
  margin-top: 20px;
  margin-bottom: 10px;
  color: #444;
  font-size: 16px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const MetricCard = styled.div<{ $warning?: boolean }>`
  padding: 12px;
  border-radius: 6px;
  background-color: ${props => props.$warning ? '#fff8f8' : '#f9f9f9'};
  border-left: 3px solid ${props => props.$warning ? '#e74c3c' : '#4caf50'};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const MetricName = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
`;

const MetricValue = styled.div<{ $warning?: boolean }>`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.$warning ? '#e74c3c' : '#333'};
`;

const ChartContainer = styled.div`
  height: 250px;
  margin: 20px 0;
`;

const TabButtons = styled.div`
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid #eee;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.$active ? '#4caf50' : 'transparent'};
  color: ${props => props.$active ? '#4caf50' : '#666'};
  font-weight: ${props => props.$active ? '600' : 'normal'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #4caf50;
  }
`;

const NoData = styled.div`
  padding: 40px;
  text-align: center;
  color: #999;
  font-size: 16px;
`;

// 性能指标阈值
const THRESHOLDS = {
  FCP: 2000,
  LCP: 2500,
  TTI: 5000,
  FID: 100,
  INP: 200,
  CLS: 0.1,
  FPS: 45,
  STUTTER_RATE: 0.1
};

interface PerformanceData {
  timestamp: number;
  metrics: Partial<PerformanceMonitorMetrics>;
}

interface JankData {
  timestamp: number;
  fps: number;
  stutterRate: number;
  jankSmall: number;
  jankMedium: number;
  jankLarge: number;
}

const PerformanceTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'jank'>('metrics');
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [jankData, setJankData] = useState<JankData[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<Partial<PerformanceMonitorMetrics>>({});
  const [currentJankMetrics, setCurrentJankMetrics] = useState<PerformancePanelMetrics | null>(null);
  const [tabId, setTabId] = useState<number | null>(null);

  useEffect(() => {
    // 获取当前标签页ID
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        setTabId(tabs[0].id);

        // 注入性能监控脚本
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: injectPerformanceMonitor,
        });
      }
    });

    // 监听来自内容脚本的消息
    const messageListener = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
      if (message.type === 'performanceMetrics') {
        const newData: PerformanceData = {
          timestamp: Date.now(),
          metrics: message.data
        };

        setPerformanceData(prev => [...prev, newData]);
        setCurrentMetrics(message.data);
        sendResponse({ received: true });
      }
      else if (message.type === 'jankMetrics') {
        const newJankData: JankData = {
          timestamp: Date.now(),
          fps: message.data.fps,
          stutterRate: message.data.jank.stutterRate,
          jankSmall: message.data.jank.small,
          jankMedium: message.data.jank.medium,
          jankLarge: message.data.jank.large
        };

        setJankData(prev => [...prev, newJankData]);
        setCurrentJankMetrics(message.data);
        sendResponse({ received: true });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // 注入到页面的性能监控脚本
  const injectPerformanceMonitor = () => {
    // 避免重复注入
    if (window.__performanceMonitorInjected) return;
    window.__performanceMonitorInjected = true;

    // 1. 页面性能指标监控
    const performanceMonitor = new PerformanceMonitor({
      debug: true,
      isDev: true,
      deviceType: 'auto',
      reportUrl: '',
      appId: 'chrome-extension',
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
        routeId: 'monitored-page'
      }
    });

    performanceMonitor.start();

    // 定期向扩展发送性能数据
    setInterval(() => {
      chrome.runtime.sendMessage({
        type: 'performanceMetrics',
        data: performanceMonitor.metrics
      });
    }, 1000);

    // 2. 卡顿监控
    const jankMonitor = new PerformanceJankStutter({
      updateInterval: 1000,
      minJankThreshold: 50,
      largeJankThreshold: 100
    });

    jankMonitor.onUpdate = (data: any) => {
      chrome.runtime.sendMessage({
        type: 'jankMetrics',
        data
      });
    };

    jankMonitor.startMonitoring();

    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
      performanceMonitor.dispose();
      jankMonitor.stopMonitoring();
    });
  };

  // 判断指标是否超过阈值
  const isWarning = (key: string, value: number): boolean => {
    const threshold = THRESHOLDS[key as keyof typeof THRESHOLDS];
    if (!threshold) return false;

    if (key === 'FPS') {
      return value < threshold;
    }
    return value > threshold;
  };

  const renderMetricsTab = () => {
    if (Object.keys(currentMetrics).length === 0) {
      return <NoData>正在收集性能指标数据...</NoData>;
    }

    const chartData = performanceData.map(item => ({
      timestamp: new Date(item.timestamp).toLocaleTimeString(),
      FCP: item.metrics.FCP,
      LCP: item.metrics.LCP,
      TTI: item.metrics.TTI,
      FID: item.metrics.FID,
      INP: item.metrics.INP
    }));

    return (
      <>
        <SectionTitle>核心性能指标</SectionTitle>
        <MetricsGrid>
          {Object.entries(currentMetrics).map(([key, value]) => {
            if (typeof value === 'number' && ['FCP', 'LCP', 'TTI', 'FID', 'INP', 'CLS'].includes(key)) {
              const warning = isWarning(key, value);
              return (
                <MetricCard key={key} $warning={warning}>
                  <MetricName>{key}</MetricName>
                  <MetricValue $warning={warning}>
                    {key === 'CLS' ? value.toFixed(3) : `${value}ms`}
                  </MetricValue>
                </MetricCard>
              );
            }
            return null;
          })}
        </MetricsGrid>

        <SectionTitle>性能指标趋势</SectionTitle>
        <ChartContainer>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="FCP" stroke="#8884d8" />
              <Line type="monotone" dataKey="LCP" stroke="#82ca9d" />
              <Line type="monotone" dataKey="TTI" stroke="#ffc658" />
              <Line type="monotone" dataKey="FID" stroke="#ff8042" />
              <Line type="monotone" dataKey="INP" stroke="#ff4242" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <SectionTitle>环境信息</SectionTitle>
        <MetricsGrid>
          <MetricCard>
            <MetricName>设备类型</MetricName>
            <MetricValue>{currentMetrics.deviceType || '未知'}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricName>网络类型</MetricName>
            <MetricValue>{currentMetrics.networkType || '未知'}</MetricValue>
          </MetricCard>
          {currentMetrics.memory && (
            <MetricCard>
              <MetricName>设备内存</MetricName>
              <MetricValue>{currentMetrics.memory}GB</MetricValue>
            </MetricCard>
          )}
          {currentMetrics.cpuCores && (
            <MetricCard>
              <MetricName>CPU核心数</MetricName>
              <MetricValue>{currentMetrics.cpuCores}</MetricValue>
            </MetricCard>
          )}
        </MetricsGrid>
      </>
    );
  };

  const renderJankTab = () => {
    if (!currentJankMetrics) {
      return <NoData>正在收集卡顿数据...</NoData>;
    }

    const chartData = jankData.map(item => ({
      timestamp: new Date(item.timestamp).toLocaleTimeString(),
      fps: item.fps,
      stutterRate: item.stutterRate * 100, // 转为百分比显示
      jankSmall: item.jankSmall,
      jankMedium: item.jankMedium,
      jankLarge: item.jankLarge
    }));

    return (
      <>
        <SectionTitle>帧率与卡顿指标</SectionTitle>
        <MetricsGrid>
          <MetricCard $warning={isWarning('FPS', currentJankMetrics.fps)}>
            <MetricName>FPS</MetricName>
            <MetricValue $warning={isWarning('FPS', currentJankMetrics.fps)}>
              {currentJankMetrics.fps}
            </MetricValue>
          </MetricCard>
          <MetricCard $warning={isWarning('STUTTER_RATE', currentJankMetrics.jank.stutterRate)}>
            <MetricName>卡顿率</MetricName>
            <MetricValue $warning={isWarning('STUTTER_RATE', currentJankMetrics.jank.stutterRate)}>
              {(currentJankMetrics.jank.stutterRate * 100).toFixed(1)}%
            </MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricName>小卡顿</MetricName>
            <MetricValue>{currentJankMetrics.jank.small}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricName>中卡顿</MetricName>
            <MetricValue>{currentJankMetrics.jank.medium}</MetricValue>
          </MetricCard>
          <MetricCard>
            <MetricName>大卡顿</MetricName>
            <MetricValue $warning={currentJankMetrics.jank.large > 0}>
              {currentJankMetrics.jank.large}
            </MetricValue>
          </MetricCard>
        </MetricsGrid>

        <SectionTitle>卡顿趋势</SectionTitle>
        <ChartContainer>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="fps" stroke="#8884d8" />
              <Line yAxisId="right" type="monotone" dataKey="stutterRate" stroke="#82ca9d" />
              <Line yAxisId="right" type="monotone" dataKey="jankSmall" stroke="#ffc658" />
              <Line yAxisId="right" type="monotone" dataKey="jankMedium" stroke="#ff8042" />
              <Line yAxisId="right" type="monotone" dataKey="jankLarge" stroke="#ff4242" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {currentJankMetrics.eventTiming && (
          <>
            <SectionTitle>事件响应延迟</SectionTitle>
            <MetricsGrid>
              <MetricCard>
                <MetricName>平均延迟</MetricName>
                <MetricValue>
                  {currentJankMetrics.eventTiming.avgDelay.toFixed(2)}ms
                </MetricValue>
              </MetricCard>
              <MetricCard $warning={currentJankMetrics.eventTiming.maxDelay > 100}>
                <MetricName>最大延迟</MetricName>
                <MetricValue $warning={currentJankMetrics.eventTiming.maxDelay > 100}>
                  {currentJankMetrics.eventTiming.maxDelay.toFixed(2)}ms
                </MetricValue>
              </MetricCard>
            </MetricsGrid>
          </>
        )}
      </>
    );
  };

  return (
    <TabContainer>
      <Title>页面性能监控</Title>

      <TabButtons>
        <TabButton
          $active={activeTab === 'metrics'}
          onClick={() => setActiveTab('metrics')}
        >
          核心性能指标
        </TabButton>
        <TabButton
          $active={activeTab === 'jank'}
          onClick={() => setActiveTab('jank')}
        >
          帧率与卡顿
        </TabButton>
      </TabButtons>

      {activeTab === 'metrics' ? renderMetricsTab() : renderJankTab()}
    </TabContainer>
  );
};

// 为TypeScript添加全局类型声明
declare global {
  interface Window {
    __performanceMonitorInjected?: boolean;
  }
}

export default PerformanceTab;