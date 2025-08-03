# 偏向于实际业务的工作流页面技术文档

## 技术栈

- 前端框架: React 18
- 工作流引擎: @xyflow/react 12.8.2
- 状态管理: zustand
- 样式处理: Less CSS 模块化
- UI 组件库: Ant Design 5.26.7

## 架构设计

### 目录结构

```
WorkFlow/
├── components/       # 工作流页面专用组件
│   ├── WorkflowSidebar.tsx  # 侧边栏组件
│   └── WorkflowToolbar.tsx  # 工具栏组件
├── hooks/           # 自定义钩子
│   └── useWorkflowControls.ts  # 工作流控制钩子
├── layouts/         # 布局组件
├── models/          # 数据模型和状态管理
│   └── nodeTypes.ts  # 节点类型定义
├── modules/         # 功能模块
├── index.tsx        # 页面入口
└── index.module.less # 页面样式
```

### 核心模块

1. **节点管理**
   - 业务流程节点定义 (start, approval, dataProcess, end)
   - 节点类型与样式配置
   - 自定义节点组件

2. **连线管理**
   - 连线类型与规则
   - 连线样式与交互
   - 连线验证逻辑

3. **画布交互**
   - 拖拽创建节点
   - 缩放与平移
   - 选择与多选操作

4. **数据流**
   - 工作流数据模型
   - 状态持久化
   - 数据导入导出

5. **业务集成**
   - 与后端 API 交互
   - 业务规则验证
   - 流程执行与监控

## 与通用组件的关系

本页面实现依赖于 `src/components/workflow` 中定义的通用工作流组件，在此基础上进行业务定制化开发。通用组件提供基础功能，业务页面负责实现特定业务逻辑和界面交互。

### 通用组件与业务组件职责划分

**通用组件 (`src/components/workflow/`):**
- 提供基础工作流画布
- 定义节点和边的基本类型
- 实现状态管理核心逻辑
- 提供导入/导出功能

**业务组件 (`src/pages/Graph/WorkFlow/`):**
- 定义特定业务节点类型
- 实现业务侧边栏和工具栏
- 处理业务特定的交互逻辑
- 集成后端 API 和业务规则

## 功能实现

### 1. 节点拖拽创建

使用 HTML5 拖放 API，从侧边栏拖拽节点到画布创建新节点。

```tsx
// 侧边栏拖拽源
const onDragStart = (event, nodeType) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
};

// 画布拖拽目标
const onDrop = (event) => {
  const type = event.dataTransfer.getData('application/reactflow');
  const position = reactFlowInstance.screenToFlowPosition({
    x: event.clientX - reactFlowBounds.left,
    y: event.clientY - reactFlowBounds.top,
  });
  addNode({ type, position, data: defaultNodeData[type] });
};
```

### 2. 状态管理

使用 Zustand 管理工作流状态，支持本地存储持久化。

```tsx
// 使用工作流状态
const { nodes, edges, updateNode } = useWorkflowStore();

// 更新节点状态
const handleApprove = (nodeId) => {
  updateNode(nodeId, { status: 'approved' });
};
```

### 3. 连线验证

实现业务规则验证，确保工作流连线符合业务逻辑。

```tsx
const isValidConnection = (connection) => {
  const sourceType = getNode(connection.source)?.type;
  const targetType = getNode(connection.target)?.type;

  // 禁止连接到开始节点
  if (targetType === 'start') return false;

  return true;
};
```

## 性能优化

1. 使用 React.memo 减少不必要的重渲染
2. 使用 Immer 进行不可变数据更新
3. 大型工作流启用节点虚拟化渲染
4. 使用 useCallback 和 useMemo 优化函数和计算

## 后续规划

1. 实现撤销/重做功能
2. 添加节点属性编辑面板
3. 集成实时协作功能
4. 增加工作流模板功能
5. 支持工作流版本管理