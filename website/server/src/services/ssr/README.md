# React SSR 实现

这是一个基于Koa和React的服务端渲染(SSR)实现。

## 功能特点

- 基于Koa的服务端渲染
- 支持React组件的服务端渲染和客户端水合
- 简单的路由系统
- 服务端数据预取
- 错误边界处理
- 流式渲染API

## 文件结构

```
ssr/
├── client/              # 客户端相关代码
│   ├── app.jsx          # 应用根组件
│   ├── Router.jsx       # 路由组件
│   ├── ErrorBoundary.jsx # 错误边界组件
│   ├── data.js          # 数据获取函数
│   ├── main.jsx         # 客户端入口
│   └── assetMap.json    # 资源映射
├── render.js            # 渲染函数
├── server.js            # 服务器入口
└── README.md            # 文档
```

## 使用方法

### 开发环境

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 生产环境

```bash
# 构建客户端和服务端代码
pnpm build

# 启动生产服务器
pnpm start
```

## 实现原理

1. **服务端渲染流程**：
   - 接收请求 -> 数据预取 -> 渲染React组件 -> 流式输出HTML

2. **客户端水合流程**：
   - 加载JS -> 复用服务端HTML -> 添加交互能力

3. **数据流转**：
   - 服务端预取数据 -> 注入到全局变量 -> 客户端获取并使用

4. **错误处理**：
   - 服务端错误中间件 + React错误边界

## 扩展方向

- 添加状态管理(Redux/MobX)
- 实现代码分割和懒加载
- 添加CSS-in-JS方案
- 实现更完善的路由系统
- 添加缓存策略