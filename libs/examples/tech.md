# Files-Buffer 技术架构文档

## 项目概述

Files-Buffer 是一个基于 TypeScript 和 React 开发的大文件分片上传解决方案，支持分片上传、断点续传和秒传功能。该项目分为两个主要部分：核心库和示例应用。

## 技术栈

### 前端技术栈

- **语言**: TypeScript 5.8.3
- **框架**: React 18.2.0+
- **构建工具**: Vite
- **测试框架**: Vitest + JSDOM
- **HTTP 客户端**: Axios 1.11.0
- **文件哈希计算**: spark-md5, SubtleCrypto (SHA-256)
- **并发控制**: Promise.allSettled
- **状态管理**: React Hooks (useState, useEffect, useRef, useCallback)

### 后端技术栈

- **运行环境**: Node.js
- **框架**: Koa.js
- **中间件**:
  - koa-body: 处理文件上传
  - koa-router: 路由管理
  - koa-cors: 跨域支持
  - koa-send: 文件下载

## 核心库架构 (@files-buffer)

### 模块结构

```
libs/files-buffer/
├── src/
│   ├── components/
│   │   ├── FileUploader.tsx      # React 上传组件
│   │   └── FileUploader.css      # 组件样式
│   ├── fileChunker.ts            # 核心分片上传逻辑
│   ├── hash.worker.ts            # Web Worker 哈希计算
│   ├── types.ts                  # 类型定义
│   └── index.ts                  # 导出接口
├── tests/                        # 单元测试
├── scripts/                      # 构建和发布脚本
└── package.json                  # 项目配置和依赖
```

### 核心功能模块

1. **FileChunker**: 负责文件分片、哈希计算和上传控制
   - 文件切片 (Blob.slice)
   - 哈希计算 (spark-md5 或 SubtleCrypto)
   - 上传控制 (暂停/恢复/取消)
   - 断点续传逻辑
   - 秒传验证

2. **FileUploader**: React 组件，提供用户界面
   - 文件选择
   - 上传进度显示
   - 哈希计算进度显示
   - 上传控制按钮 (暂停/恢复/取消)
   - 状态管理和错误处理

3. **Web Worker**: 优化哈希计算
   - 将哈希计算移至独立线程
   - 支持进度报告
   - 大文件优化 (SHA-256 替代方案)
   - 超时处理和错误恢复

## 示例应用架构 (@examples)

### 目录结构

```
libs/examples/
├── server/
│   └── server-koa-example.js     # Koa 服务器实现
├── web/
│   ├── index.html                # 主页面
│   ├── html-upload.html          # 原生 HTML 上传示例
│   ├── main.tsx                  # React 入口
│   ├── BasicExample.tsx          # React 上传示例
│   ├── styles.css                # 全局样式
│   └── vite.config.ts            # Vite 配置
└── package.json                  # 项目配置和依赖
```

### 服务端 API

1. **检查文件 `/api/check`**
   - 功能: 验证文件是否已存在 (秒传) 和获取已上传分片
   - 请求: `POST { fileHash, fileName }`
   - 响应: `{ exists, uploadedChunks?, url? }`

2. **上传分片 `/api/upload`**
   - 功能: 接收并存储单个文件分片
   - 请求: `POST FormData { chunk, index, fileHash }`
   - 响应: `{ success }`

3. **合并分片 `/api/merge`**
   - 功能: 合并所有分片为完整文件
   - 请求: `POST { fileHash, fileName, size? }`
   - 响应: `{ success, url, ...fileInfo }`

4. **文件访问 `/files/:hash`**
   - 功能: 提供上传后的文件下载
   - 请求: `GET /files/:hash`
   - 响应: 文件内容

## 数据流程

1. **文件选择**
   - 用户选择文件
   - 创建 FileChunker 实例

2. **哈希计算**
   - 计算文件唯一标识 (MD5/SHA-256)
   - 使用 Web Worker 避免阻塞 UI

3. **秒传验证**
   - 发送 `/api/check` 请求
   - 如果文件已存在，直接返回成功

4. **分片上传**
   - 切割文件为多个分片
   - 跳过已上传的分片 (断点续传)
   - 并发上传分片到 `/api/upload`
   - 支持暂停/恢复/取消

5. **合并文件**
   - 所有分片上传完成后
   - 发送 `/api/merge` 请求
   - 服务端合并分片为完整文件

## 优化策略

1. **性能优化**
   - Web Worker 哈希计算
   - 并发控制上传请求
   - 大文件使用 SHA-256 替代 spark-md5
   - 分片大小自适应

2. **可靠性优化**
   - 请求超时和重试机制
   - 断点续传支持
   - 网络状态监控
   - 错误处理和恢复

3. **用户体验优化**
   - 实时进度显示
   - 上传控制 (暂停/恢复/取消)
   - 网络状态提示
   - 错误信息展示

## 部署和构建

- 使用 Vite 构建前端资源
- 使用 pnpm/npm 管理依赖
- 支持 npm 包发布
- 提供构建和发布脚本

## 扩展性

- 模块化设计便于扩展
- 可配置的上传参数 (分片大小、并发数等)
- 支持自定义上传和哈希计算逻辑
- 提供钩子函数支持自定义业务逻辑
