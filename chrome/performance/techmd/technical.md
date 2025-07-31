# Chrome标签页性能监控扩展技术文档

## 架构设计

### 1. 扩展程序分层结构

#### Background Service（后台服务）
- 负责管理内存监控和泄漏检测
- 轮询所有标签页内存状态
- 实现泄漏检测算法
- 管理阈值配置

#### Content Script（内容脚本）
- 注入到每个标签页中
- 收集内存和性能数据
- 监控DOM节点变化
- 集成performance-monitor库

#### Popup UI（用户界面）
- 基于React 18构建
- 展示内存排名和泄漏警告
- 展示性能指标和图表
- 提供配置界面

### 2. 数据流设计

```
Content Script ──> Background Service ──> Storage Service
      │                    │                    │
      └─────────────┬──────┘                    │
                    ↓                           │
              Memory Analyzer <─────────────────┘
                    │
                    ↓
                 Popup UI
```

## 核心模块

### 1. 内存监控模块

#### 实时采集
- 通过`chrome.scripting.executeScript`注入内容脚本
- 使用`performance.memory` API获取堆内存大小
- 定期采样并发送数据到后台服务

#### DOM泄漏检测
- 记录DOM节点数量变化
- 分析节点增长趋势
- 检测未释放的事件监听器

### 2. 泄漏检测算法

#### 趋势分析算法
- 基于滑动窗口计算内存增长斜率
- 使用线性回归分析增长趋势
- 设置动态阈值进行告警

```typescript
// 计算增长率（每分钟百分比）
private calculateGrowthRate(samples: number[]): number {
  if (samples.length < 2) return 0;

  // 计算线性回归斜率
  const n = samples.length;
  const timestamps = Array.from({ length: n }, (_, i) => i);

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += timestamps[i];
    sumY += samples[i];
    sumXY += timestamps[i] * samples[i];
    sumX2 += timestamps[i] * timestamps[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  // 如果第一个样本为0，使用第二个样本作为基准
  const baseValue = samples[0] || samples[1] || 1;

  // 计算每分钟的增长率（样本间隔为this.config.sampleInterval毫秒）
  const samplesPerMinute = 60000 / this.config.sampleInterval;
  return (slope * samplesPerMinute) / baseValue;
}
```

### 3. 性能监控集成

#### Core Web Vitals监控
- 集成performance-monitor库
- 监控FCP、LCP、TTI、FID、INP、CLS等指标
- 使用PerformanceObserver API收集数据

#### 帧率与卡顿监控
- 使用RequestAnimationFrame计算帧率
- 检测卡顿事件和严重卡顿
- 分析事件响应延迟

### 4. 数据存储

#### IndexedDB存储
- 使用Dexie.js简化IndexedDB操作
- 存储历史内存和性能数据
- 自动清理过期数据（24小时）

#### 配置存储
- 存储用户自定义的检测阈值
- 支持跨会话保持配置

## 技术实现细节

### 1. 内存数据采集

```typescript
// 在内容脚本中收集内存数据
function collectMemoryData() {
  try {
    // 获取内存信息
    const memory = (performance as any).memory;
    if (!memory) return;

    // 获取DOM节点数量
    const domNodeCount = document.querySelectorAll('*').length;

    // 发送数据到后台脚本
    chrome.runtime.sendMessage({
      type: 'memoryUpdate',
      tabId: -1, // 后台脚本会替换为实际的tabId
      data: {
        heapSize: memory.usedJSHeapSize,
        totalHeapSize: memory.totalJSHeapSize,
        domNodeCount,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('内存数据收集错误:', error);
  }
}
```

### 2. 性能监控适配

```typescript
// 适配performance-monitor库到Chrome扩展
export function initPerformanceMonitoring(): void {
  // 检查是否已经注入
  if ((window as any).__performanceMonitorInjected) return;
  (window as any).__performanceMonitorInjected = true;

  // 创建并启动监控
  const adapter = new PerformanceMonitorAdapter();
  adapter.start();

  // 页面卸载时清理
  window.addEventListener('beforeunload', () => {
    adapter.stop();
  });
}
```

### 3. 数据可视化

- 使用Recharts库创建交互式图表
- 实时更新内存和性能趋势
- 支持多维度数据展示

## 性能优化

### 1. 资源开销控制

- 限制采样频率（默认5秒/次）
- 使用节流和防抖优化事件处理
- 压缩存储的历史数据

### 2. 内存使用优化

- 限制历史数据存储量
- 定期清理不活跃标签页的数据
- 使用弱引用（WeakMap）跟踪DOM元素

## 安全与隐私

### 1. 权限最小化

- 仅申请必要的Chrome API权限
- 不收集或传输敏感数据

### 2. 数据隔离

- 所有数据本地存储
- 不同标签页数据相互隔离
- 不记录URL内容，仅存储域名

## 扩展能力

### 1. 自定义规则

- 支持用户配置检测阈值
- 可调整采样频率和检测灵敏度

### 2. 导出功能

- 支持导出监控数据
- 提供性能报告生成功能

## 已知限制

1. 某些网站的内容安全策略(CSP)可能会限制Performance API的使用
2. 在隐私浏览模式下，部分API可能受限
3. 精确内存测量需要Chrome启动时添加`--enable-precise-memory-info`参数

## 未来计划

1. 添加更多性能指标（如首屏渲染时间、资源加载时间）
2. 实现更精确的内存泄漏定位（堆快照比对）
3. 提供更丰富的数据导出和分析功能
4. 支持自定义告警规则和通知方式