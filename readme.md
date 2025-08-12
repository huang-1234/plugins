# AI Code 项目架构设计与功能模块

## 项目概述

AI Code 是一个综合性前端工具集项目，包含多个独立但相互关联的模块，主要聚焦于性能监控、文件处理和可视化工作流等领域。

项目采用 monorepo 结构，使用 pnpm workspace 进行包管理，确保各模块间的依赖关系清晰且可维护。
## 技术栈

- **前端框架**: React 18.2.0, TypeScript 5.8.3
- **UI 组件**: Ant Design 5.26.7
- **状态管理**: Zustand 4.5.7, Immer 10.1.1
- **构建工具**: Vite 5.4.19, Rollup 4.12.0
- **包管理**: PNPM 10.13.1 (Workspace)
- **测试框架**: Vitest 3.2.4
- **文档工具**: RSPress 1.44.0
- **后端框架**: Koa 2.16.2
- **AI 集成**: LangChain 0.0.140, OpenAI API

## 项目结构

```
/
├── libs/                  # 核心库
│   ├── performance-monitor/  # 性能监控库
│   ├── files-buffer/         # 大文件分片上传库
│   └── examples/             # 示例代码
├── chrome/                # 浏览器扩展
│   └── performance/       # 性能监控扩展
├── website/               # 项目官网
│   ├── web/               # 前端
│   └── server/            # 后端
├── vscode/                # VSCode 扩展
├── tech/                  # 技术文档
└── package.json           # 根项目配置
```

## 核心模块

### 1. 性能监控库 (perfor-monitor)

位置: `/libs/performance-monitor`

功能:
- 监控核心 Web Vitals 指标 (FCP, LCP, TTI, FID, INP, CLS)
- 检测页面卡顿和帧率下降
- 提供实时性能数据报告
- 支持 React 集成

技术特点:
- 基于 Performance API 和 PerformanceObserver
- 使用 RequestAnimationFrame 计算帧率
- 支持移动端和桌面端设备自适应
- 提供 UMD/ESM/CJS 多种格式输出

### 2. 大文件分片上传库 (files-buffer)

位置: `/libs/files-buffer`

功能:
- 文件分片上传：使用 `Blob.slice()` 切割大文件
- 断点续传：记录已上传分片，支持页面刷新后继续上传
- 秒传：基于文件哈希验证，避免重复上传
- 并发控制：可配置同时上传的分片数量

技术特点:
- 使用 Web Worker 计算文件哈希，避免主线程阻塞
- 基于 `crypto.subtle.digest('SHA-256', data)` 和 `Spark-MD5` 进行文件指纹计算
- 提供 React 组件和核心 API 两种使用方式
- 支持上传控制（暂停/恢复/取消）

### 3. Chrome 性能监控扩展

位置: `/chrome/performance`

功能:
- 实时监控标签页内存使用情况
- 检测内存泄漏（基于内存增长趋势分析）
- 监控 DOM 节点数量变化
- 可视化内存使用趋势图表

技术特点:
- 基于 Chrome Extension Manifest V3
- 使用 React 构建扩展 UI
- 使用 IndexedDB 存储历史监控数据
- 集成 perfor-monitor 库进行性能指标采集

### 4. 项目官网

位置: `/website`

#### 4.1 前端 (web)

功能:
- 项目展示与文档
- 工作流可视化编辑器
- 知识图谱可视化
- 文件上传示例

技术特点:
- 基于 React + TypeScript + Vite
- 使用 @xyflow/react 实现工作流编辑器
- 使用 Cytoscape.js 实现知识图谱可视化
- 集成 files-buffer 实现大文件上传功能
- 使用 Zustand 进行状态管理

#### 4.2 后端 (server)

功能:
- 文件上传处理
- AI 服务集成
- SSE (Server-Sent Events) 实时通信
- API 文档 (Swagger)

技术特点:
- 基于 Koa + TypeScript
- 集成 LangChain 和 OpenAI API
- 使用 WebSocket 和 SSE 实现实时通信
- 支持大文件分片上传、合并和验证

## 功能模块详解

### 1. 工作流编辑器

位置: `/website/web/src/pages/Graph/WorkFlow`

功能:
- 可视化工作流设计
- 节点拖拽和连线
- 支持多种节点类型（开始、审批、数据处理、结束）
- 节点右键菜单和键盘快捷键
- 工作流导入/导出

技术实现:
- 基于 @xyflow/react 12.8.2
- 使用 Zustand 管理工作流状态
- 自定义节点和边的渲染
- 使用 lodash-es 优化拖拽性能
- 支持工作流数据持久化

### 2. 知识图谱可视化

位置: `/website/web/src/pages/Graph/Cytoscape`

功能:
- 知识图谱节点和关系展示
- 交互式图谱操作（缩放、拖拽、选择）
- 节点分组和过滤
- 图谱布局算法选择

技术实现:
- 基于 Cytoscape.js
- 自定义节点和边样式
- 支持多种布局算法
- 图谱数据导入/导出

### 3. 性能监控面板

位置: `/website/web/src/hooks/usePerformance.ts`

功能:
- 页面性能指标监控
- 性能数据可视化
- 性能问题告警

技术实现:
- 集成 perfor-monitor 库
- 自定义 React Hook 封装
- 性能数据持久化
- 性能指标阈值配置

### 4. 文件上传模块

位置: `/website/web/src/pages/UploadPage`

功能:
- 大文件分片上传
- 上传进度展示
- 断点续传
- 文件秒传

技术实现:
- 集成 files-buffer 库
- 自定义上传组件
- 上传状态管理
- 服务端接口集成

## 开发与构建

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 开发官网
cd website
pnpm dev

# 开发性能监控库
cd libs/performance-monitor
pnpm dev

# 开发文件上传库
cd libs/files-buffer
pnpm dev

# 开发 Chrome 扩展
cd chrome/performance
pnpm build:dev
```

### 构建项目

```bash
# 构建所有项目
pnpm build

# 构建特定项目
pnpm --filter perfor-monitor build
pnpm --filter files-buffer build
pnpm --filter memory-monitor-extension build
pnpm --filter @website/web build
pnpm --filter @website/server build
```

## 部署

### 官网部署

```bash
cd website
./deploy.sh
```

### 库发布

```bash
cd libs/performance-monitor
pnpm publish:npm

cd libs/files-buffer
pnpm publish-npm
```

### Chrome 扩展发布

```bash
cd chrome/performance
pnpm build:zip
# 然后在 Chrome Web Store 开发者后台上传 zip 文件
```

## 未来规划

1. 增强 AI 集成能力，提供更智能的工作流推荐
2. 扩展性能监控库，支持更多自定义指标
3. 优化文件上传库，支持更多文件处理场景
4. 开发 VSCode 扩展，提供更好的开发体验
5. 增加更多可视化组件和模板

## 许可证

ISC 和 MIT (根据不同模块)
