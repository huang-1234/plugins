# Chrome标签页性能监控扩展

这是一个Chrome浏览器扩展，用于监控标签页内存使用、性能指标以及检测可能的内存泄漏。

## 功能特点

### 内存监控
- 实时监控所有标签页的JS堆内存使用情况
- 检测内存泄漏（基于内存增长趋势分析）
- 监控DOM节点数量变化
- 可视化内存使用趋势图表
- 自定义内存阈值和检测规则

### 性能监控
- Core Web Vitals指标监控（FCP、LCP、TTI、FID、INP、CLS等）
- 帧率（FPS）监控
- 卡顿检测与统计
- 事件响应延迟监控
- 性能趋势可视化

## 技术架构

### 前端
- React 18
- TypeScript 5
- Styled Components
- Recharts（图表库）

### 扩展架构
- Background Service：管理内存监控和泄漏检测
- Content Script：注入到页面中收集内存和性能数据
- Popup UI：展示监控结果和配置界面

### 数据存储
- IndexedDB：存储历史监控数据
- Chrome Storage API：存储配置

## 安装方法

### 开发环境
1. 克隆仓库
2. 进入项目目录
```bash
cd chrome/performance
```
3. 安装依赖并构建
```bash
bash install.bash
```
4. 在Chrome浏览器中加载扩展
   - 打开 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目的`dist`目录

## 使用指南

### 内存监控
- 点击扩展图标打开监控面板
- 查看标签页内存使用排名
- 点击标签页查看详细内存使用趋势
- 在配置部分自定义检测阈值

### 性能监控
- 切换到"性能监控"标签页
- 查看Web性能指标（FCP、LCP等）
- 切换到"帧率与卡顿"查看页面流畅度指标
- 观察性能趋势图表

## 配置选项

### 内存监控配置
- 堆内存阈值（MB）：超过此值触发警告
- 增长率阈值（%/分钟）：内存增长速率超过此值判定为可能泄漏
- 采样间隔（秒）：数据收集频率
- DOM节点阈值：DOM节点数量超过此值触发警告

## 原理说明

### 内存泄漏检测
- 滑动窗口算法计算内存增长趋势
- 基于多次采样分析内存使用模式
- DOM节点数量变化监测

### 性能监测
- 基于Performance API和PerformanceObserver
- 使用RequestAnimationFrame计算帧率
- Event Timing API监测事件响应延迟

## 注意事项
- 扩展需要访问网页内容的权限才能正常工作
- 某些网站可能限制Performance API的使用
- 在安全模式下可能无法正常工作