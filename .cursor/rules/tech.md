🧠 Cursor 智能编码规则（React18+TS5+Vite / Node.js+TS+Koa / LangGraph+LangChain）
一、技术栈
- 前端​：React 18 + TypeScript 5+ + Vite
- 后端​：Node.js + TypeScript 5+ + Koa
- AI 编排​：LangGraph（有状态工作流） + LangChain（LLM/工具编排）

---
二、通用准则
1. 类型安全​：全面使用 TS 类型，避免 any，推荐 interface/type/zod。
2. 模块化​：按功能/路由分层，避免巨型文件，推荐单一职责。
3. 代码风格​：ES Module，async/await，清晰的错误处理，无回调地狱。
4. 注释与文档​：复杂逻辑、AI 节点、工作流状态需注释说明。

---
三、前端（React18 + TS + Vite）
项目结构建议
src/
├── components/    # 通用组件
├── pages/         # 页面组件
├── hooks/         # 自定义 Hooks（useXxx）
├── services/      # API 请求封装
├── stores/        # 状态管理（如 Zustand）
├── types/         # 类型定义
├── utils/         # 工具函数
└── App.tsx
规则
- 函数组件 + Hooks，避免 Class 组件。
- 组件 Props 必须定义 TS 类型。
- 路由推荐 react-router-dom v6+，状态管理推荐 Zustand/Jotai。
- Vite 别名 @ → src/，Cursor 应能正确识别。

---
四、后端（Node.js + TS + Koa）
项目结构建议
src/
├── app.ts         # Koa 应用配置
├── server.ts      # 服务启动
├── controllers/   # 请求逻辑
├── services/      # 业务逻辑
├── routes/        # 路由定义
├── models/        # 数据模型
├── middleware/    # Koa 中间件
├── types/         # 类型定义
└── utils/         # 工具函数
规则
- Koa2 + async/await 中间件。
- Controller → Service 分层，职责清晰。
- 接口请求/响应需定义 TS 类型。
- 使用 koa-bodyparser / joi 等做参数校验。
- 环境变量通过 dotenv 加载，推荐类型校验。

---
五、AI 编排（LangGraph + LangChain）
5. LangGraph（有状态工作流）
- 用于构建多步骤、有状态、可循环的 AI Agent 流程。
- 核心概念：State（类型定义）、Node（步骤函数）、Edge（流程控制）、Graph、Runner。
- 推荐目录结构：
/ai/orchestrator/
  ├── state.ts      # 工作流状态类型
  ├── nodes.ts      # 各节点函数
  ├── workflows/    # 具体工作流定义
  └── run.ts        # 启动入口
- 每个节点需明确输入输出类型，状态共享建议用单一 State 对象。
6. LangChain（LLM / 工具 / Agent）
- 用于 LLM 调用、工具集成、Prompt 管理、Agent 设计等。
- 推荐模块划分：
/ai/langchain/
  ├── prompts/     # Prompt 模板
  ├── tools/       # 自定义 Tools
  ├── chains/      # Chain 组合
  └── agents/      # ReAct / Tool 使用类 Agent
- 所有 Tool / Chain / Agent 需定义输入输出类型，推荐封装复用。
- LangChain 服务建议部署在后端 Node.js 服务中，对外提供 API。
7. AI 与后端集成
- AI 编排服务作为后端模块，前端通过 HTTP 调用。
- 所有 LLM 相关输入/输出需做安全校验与结构化处理。

---
六、开发建议
1. 明确技术上下文​：向 Cursor 提问时指定技术栈，例如：
1. “用 React18 + TS + Vite 实现表单组件”
 “用 Koa + TS 写用户登录接口”
 “用 LangGraph 编写带循环的 AI 工作流”
2. 目录结构遵循规范​：Cursor 应按上述模块划分生成代码，避免混乱。
3. 类型驱动开发​：所有 API、状态、Props、AI 输入输出必须定义 TypeScript 类型。
4. 安全与健壮性​：AI 生成代码需包含错误处理、参数校验、异常捕获。
5. 工具推荐
  - 前端：zod, axios, react-query, tailwindcss
  - 后端：zod, cls-hooked, Prisma / Sequelize
  - AI：langchain, langgraph, @langchain/core

---
七、示例提示词（供参考）
- “用 React18 + TS + Vite 实现一个带校验的用户设置页面”
- “用 Koa + TS 实现 /api/users 接口，包含 JWT 校验和分层结构”
- “用 LangGraph 编写多步推理工作流，状态定义在 state.ts”
- “用 LangChain 实现一个调用内部 API 的 Tool，并接入 ReAct Agent”