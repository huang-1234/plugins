# Performance Monitor

一个用于监控网页性能指标和卡顿检测的工具库。

## 功能特点

- 📊 监控核心Web Vitals指标 (FCP, LCP, TTI, FID, INP, CLS)
- 🔍 检测页面卡顿和帧率下降
- 📱 自动适配移动端和桌面端设备
- 📈 提供实时性能数据报告
- 🚀 支持React集成

## 安装

```bash
npm install performance-monitor
# 或
yarn add performance-monitor
# 或
pnpm add performance-monitor
```

## 基本使用

### 性能监控

```javascript
import { PerformanceMonitor } from 'performance-monitor';

// 创建监控实例
const monitor = new PerformanceMonitor({
  appId: 'your-app-id',
  reportUrl: '/api/performance', // 可选，性能数据上报地址
  debug: true, // 开发环境建议开启，会在控制台输出调试信息
  isDev: process.env.NODE_ENV !== 'production',
  warnings: {
    FCP: 2000, // 首次内容绘制阈值 (ms)
    LCP: 2500, // 最大内容绘制阈值 (ms)
    TTI: 5000, // 可交互时间阈值 (ms)
    FID: 100,  // 首次输入延迟阈值 (ms)
    INP: 200,  // 交互延迟阈值 (ms)
    CLS: 0.1,  // 累积布局偏移阈值
  },
  pageInfo: {
    pageUrl: window.location.href,
    pageTitle: document.title,
    routeId: 'home-page' // 可选，用于标识不同页面
  }
});

// 启动监控
monitor.start();

// 手动触发报告（通常不需要，会在页面卸载时自动触发）
monitor.report();

// 清理资源
monitor.dispose();
```

### 卡顿监控

```javascript
import { PerformanceJankStutter } from 'performance-monitor';

// 创建卡顿监控实例
const jankMonitor = new PerformanceJankStutter({
  updateInterval: 1000,    // 数据更新间隔 (ms)
  minJankThreshold: 50,    // 小卡顿阈值 (ms)
  largeJankThreshold: 100  // 大卡顿阈值 (ms)
});

// 设置数据更新回调
jankMonitor.onUpdate = (data) => {
  console.log('FPS:', data.fps);
  console.log('卡顿率:', data.jank.stutterRate);
  console.log('小卡顿次数:', data.jank.small);
  console.log('中卡顿次数:', data.jank.medium);
  console.log('大卡顿次数:', data.jank.large);
};

// 启动监控
jankMonitor.startMonitoring();

// 停止监控
jankMonitor.stopMonitoring();
```

## React中使用

```jsx
import React, { useEffect } from 'react';
import { PerformanceMonitor, PerformanceJankStutter } from 'performance-monitor';

function App() {
  useEffect(() => {
    // 初始化性能监控
    const performanceMonitor = new PerformanceMonitor({
      appId: 'react-app',
      reportUrl: '/api/performance',
      debug: true,
      isDev: process.env.NODE_ENV !== 'production',
      // ...其他配置
    });

    performanceMonitor.start();

    // 初始化卡顿监控
    const jankMonitor = new PerformanceJankStutter();
    jankMonitor.startMonitoring();

    // 组件卸载时清理
    return () => {
      performanceMonitor.dispose();
      jankMonitor.stopMonitoring();
    };
  }, []);

  return (
    <div>
      <h1>My App</h1>
      {/* 应用内容 */}
    </div>
  );
}
```

## 浏览器直接使用

```html
<!DOCTYPE html>
<html>
<head>
  <title>Performance Monitor Demo</title>
</head>
<body>
  <!-- 引入UMD格式的库 -->
  <script src="path/to/performance-monitor.min.js"></script>

  <script>
    // 使用全局变量 PerformanceMonitor
    const monitor = new PerformanceMonitor.PerformanceMonitor({
      appId: 'browser-app',
      // ...其他配置
    });

    monitor.start();
  </script>
</body>
</html>
```

## API文档

### PerformanceMonitor

#### 配置选项

| 选项 | 类型 | 描述 |
|------|------|------|
| `appId` | string | 应用ID，用于标识不同应用 |
| `reportUrl` | string | 性能数据上报地址 |
| `debug` | boolean | 是否输出调试信息 |
| `isDev` | boolean | 是否为开发环境 |
| `maxTime` | number | 最大监控时间(ms) |
| `deviceType` | 'mobile' \| 'desktop' \| 'auto' | 设备类型 |
| `warnings` | object | 性能指标警告阈值 |
| `pageInfo` | object | 页面信息 |

#### 方法

| 方法 | 描述 |
|------|------|
| `start()` | 启动性能监控 |
| `report()` | 生成并发送性能报告 |
| `dispose()` | 清理资源 |

### PerformanceJankStutter

#### 配置选项

| 选项 | 类型 | 描述 |
|------|------|------|
| `frame` | number | 帧率(ms)，默认16.67 |
| `deviceRefreshRate` | number | 设备刷新率(Hz)，默认60 |
| `minJankThreshold` | number | 小卡顿阈值(ms)，默认50 |
| `largeJankThreshold` | number | 大卡顿阈值(ms)，默认100 |
| `updateInterval` | number | 数据更新间隔(ms)，默认1000 |

#### 方法

| 方法 | 描述 |
|------|------|
| `startMonitoring()` | 启动卡顿监控 |
| `stopMonitoring()` | 停止卡顿监控 |

## 许可证

ISC