# Performance Monitor

一个用于监控Web应用性能指标和帧率卡顿的JavaScript库。

## 特性

- 监控Core Web Vitals (FCP, LCP, CLS, FID, INP等)
- 帧率(FPS)监控和卡顿检测
- 事件响应延迟分析
- 自定义性能指标阈值
- 支持React组件和原生JavaScript API

## 安装

```bash
# npm
npm install performance-monitor

# yarn
yarn add performance-monitor

# pnpm
pnpm add performance-monitor
```

## 使用方法

### 基本用法

```javascript
import { PerformanceMonitor } from 'performance-monitor';

// 创建监控实例
const monitor = new PerformanceMonitor({
  appId: 'my-app',
  debug: true,
  isDev: process.env.NODE_ENV !== 'production',
  deviceType: 'auto',
  pageInfo: {
    pageUrl: window.location.href,
    pageTitle: document.title
  }
});

// 启动监控
monitor.start();

// 获取性能报告
setTimeout(() => {
  monitor.report();
}, 3000);

// 清理资源
window.addEventListener('beforeunload', () => {
  monitor.dispose();
});
```

### 帧率和卡顿监控

```javascript
import { PerformanceJankStutter } from 'performance-monitor';

// 创建帧率监控实例
const jankMonitor = new PerformanceJankStutter({
  updateInterval: 1000 // 每秒更新一次
});

// 设置回调函数
jankMonitor.onUpdate = (data) => {
  console.log('FPS:', data.fps);
  console.log('卡顿率:', data.jank.stutterRate);
  console.log('卡顿次数:', data.jank.small, data.jank.medium, data.jank.large);
};

// 启动监控
jankMonitor.startMonitoring();

// 清理资源
window.addEventListener('beforeunload', () => {
  jankMonitor.stopMonitoring();
});
```

### React Hooks

```jsx
import { useJankStutter } from 'performance-monitor';

function MyComponent() {
  const { panelJank } = useJankStutter();

  // 组件卸载时会自动清理资源

  return (
    <div>
      {/* 您的组件内容 */}
    </div>
  );
}
```

## API参考

### PerformanceMonitor

监控Web性能指标的主类。

#### 构造函数选项

```typescript
interface PerformanceMonitorOps {
  warnings: {
    FCP?: number;  // 首次内容绘制阈值 (ms)
    LCP: number;   // 最大内容绘制阈值 (ms)
    TTI?: number;  // 可交互时间阈值 (ms)
    FID?: number;  // 首次输入延迟阈值 (ms)
    INP?: number;  // 交互到下一次绘制阈值 (ms)
    CLS?: number;  // 累积布局偏移阈值
  };
  reportUrl: string;  // 性能数据上报URL
  appId: string;      // 应用ID
  debug?: boolean;    // 是否开启调试模式
  isDev?: boolean;    // 是否为开发环境
  maxTime?: number;   // 最大监控时间 (ms)
  deviceType?: 'mobile' | 'desktop' | 'auto';
  networkType?: string;
  pageInfo?: {
    pageUrl: string;
    pageTitle: string;
    routeId?: string;
  };
}
```

#### 方法

- `start()`: 开始监控
- `report()`: 生成并发送性能报告
- `dispose()`: 清理资源

### PerformanceJankStutter

监控帧率和卡顿的类。

#### 构造函数选项

```typescript
interface JankStutterOptions {
  frame?: number;                // 帧率 (ms)
  deviceRefreshRate?: number;    // 设备刷新率 (Hz)
  minJankThreshold?: number;     // 小卡顿阈值 (ms)
  largeJankThreshold?: number;   // 大卡顿阈值 (ms)
  updateInterval?: number;       // 数据更新间隔 (ms)
}
```

#### 方法

- `startMonitoring()`: 开始监控
- `stopMonitoring()`: 停止监控

#### 回调

- `onUpdate`: 数据更新回调函数，接收性能指标数据

## 构建和开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm run dev

# 构建库
pnpm run build

# 运行测试
pnpm run test

# 构建文档
pnpm run docs:build
```

## 许可证

ISC