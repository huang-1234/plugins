# 项目技术架构文档 (v1)

## 整体架构概述
本项目是一个多包工作区(pnpm workspace)，包含浏览器扩展、文件处理库和性能监控工具等模块。主要技术栈包括：
- 前端：React 18 + TypeScript 5 + Vite
- 后端：Node.js + Koa + TypeScript
- 构建工具：Vite/Rspack
- 包管理：pnpm

## 核心模块

### 1. Chrome 性能监控扩展
- **技术栈**：React 18 + TypeScript + Chrome API
- **架构分层**：
  - Background Service：内存监控和泄漏检测
  - Content Script：注入页面收集性能数据
  - Popup UI：React构建的用户界面
- **核心功能**：
  - 实时内存监控(performance.memory API)
  - DOM泄漏检测(WeakMap跟踪引用)
  - 趋势分析算法(滑动窗口计算增长斜率)

### 2. Files-Buffer 文件处理库
- **技术栈**：TypeScript + React + Web Workers
- **核心功能**：
  - 大文件分片上传
  - 断点续传和秒传
  - Web Worker哈希计算(spark-md5/SubtleCrypto)
- **模块结构**：
  - FileChunker：核心分片逻辑
  - FileUploader：React组件
  - hash.worker：Web Worker实现

### 3. 性能监控库(performance-monitor)
- **技术栈**：TypeScript + Rspress(文档)
- **功能特点**：
  - 浏览器性能指标监控
  - Jank/Stutter检测
  - 虚拟滚动优化

## 公共技术栈

### 前端技术栈
- React 18 (函数组件+Hooks)
- TypeScript 5 (严格类型检查)
- Vite/Rspack (构建工具)
- Vitest (单元测试)
- Axios (HTTP客户端)

### 后端技术栈
- Node.js (运行时)
- Koa 2 (Web框架)
- koa-bodyparser/koa-router (中间件)
- TypeScript 5 (类型安全)

### 开发工具链
- pnpm (包管理)
- ESLint (代码规范)
- Rspress (文档生成)
- VSCode (开发环境)

## 项目结构

plugins/
├── chrome/ # 浏览器扩展项目
│ └── performance/ # 性能监控扩展
├── libs/ # 公共库
│ ├── files-buffer/ # 文件处理库
│ └── performance-monitor/ # 性能监控库
├── vscode/ # VSCode扩展
└── website/ # 文档网站
│ ├── server/ # 后端服务
│ └── web/ # 前端应用


## 最佳实践
1. 类型安全：全面使用TypeScript类型定义
2. 模块化：按功能分层，单一职责原则
3. 代码风格：ES Module + async/await
4. 测试覆盖：Vitest + JSDOM单元测试
5. 文档驱动：技术决策记录在techmd目录

## 依赖管理
- 使用pnpm workspace管理多包依赖
- 主要生产依赖：
  - React 18 + 相关生态
  - Koa 2 + 中间件
  - LangChain (AI集成)
- 开发工具：
  - Vite/Rspack
  - TypeScript 5
  - Vitest