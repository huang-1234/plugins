# Files-Buffer 大文件上传示例项目

这是 Files-Buffer 库的示例项目，展示了如何使用该库实现大文件分片上传、断点续传和秒传功能。

## 项目结构

- `server/`: 服务器端示例代码 (Node.js + Koa)
- `web/`: 前端示例代码
  - React 组件示例
  - 原生 HTML/JS 示例

## 快速开始

### 安装依赖

```bash
npm run install:all
```

这将安装根目录、服务器端和前端的所有依赖。

### 启动项目

```bash
npm run dev
```

这将同时启动服务器和前端应用：

- 服务器: http://localhost:3000
- 前端: http://localhost:5173

### 单独启动服务

如果您只想启动服务器：

```bash
npm run server
```

如果您只想启动前端：

```bash
npm run web
```

## 功能演示

示例项目展示了以下功能：

1. **文件分片上传**：将大文件切割成小块进行上传
2. **断点续传**：支持上传中断后继续上传
3. **秒传**：检测到相同文件时自动跳过上传过程
4. **上传进度显示**：实时显示上传进度
5. **哈希计算**：使用 spark-md5 计算文件唯一标识

## 技术栈

- 前端：React、TypeScript、Vite
- 服务器：Node.js、Koa
- 文件处理：spark-md5、原生 File API

## 注意事项

- 示例项目仅供演示，不建议直接用于生产环境
- 上传的文件存储在 `server/uploads` 目录中
- 默认分片大小为 5MB，可以在代码中调整