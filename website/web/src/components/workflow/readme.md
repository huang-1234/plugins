# 通用抽象的工作流组件

## 概述

基于 @xyflow/react 12.8.2 构建的通用工作流组件库，提供了基础的节点、边和工作流画布组件，可用于构建各种业务场景下的工作流应用。

## 组件结构

```
workflow/
├── index.tsx           # 导出所有组件
├── BaseWorkflow.tsx    # 基础工作流组件
├── types.ts            # 类型定义
├── nodes/              # 节点组件
│   ├── BusinessNode.tsx    # 基础业务节点
│   ├── ApprovalNode.tsx    # 审批节点
│   └── nodes.module.less   # 节点样式
├── edges/              # 边组件
│   ├── CustomEdge.tsx      # 自定义边
│   └── edges.module.less   # 边样式
├── hooks/              # 自定义钩子
│   └── useConnectionValidator.ts # 连接验证钩子
├── store/              # 状态管理
│   └── workflowStore.ts     # 工作流状态存储
└── utils/              # 工具函数
    └── workflowIO.ts        # 导入导出工具
```

## 核心功能

1. **节点管理**
   - 提供多种类型的业务节点（开始、审批、数据处理、结束等）
   - 支持自定义节点样式和交互
   - 节点状态可视化（待处理、已批准、已拒绝等）

2. **连线管理**
   - 自定义连线样式
   - 连线验证规则
   - 支持拒绝路径的特殊样式

3. **状态管理**
   - 基于 Zustand 的状态管理
   - 支持本地存储持久化
   - 提供导入/导出功能

4. **交互能力**
   - 拖拽创建节点
   - 连线验证
   - 支持只读模式

## 使用方法

### 基础用法

```tsx
import { BaseWorkflow } from '@/components/workflow';

const MyWorkflow = () => {
  const initialNodes = [
    {
      id: 'node-1',
      type: 'approval',
      position: { x: 100, y: 100 },
      data: { label: '审批节点', status: 'pending' }
    }
  ];

  const initialEdges = [];

  return <BaseWorkflow initialNodes={initialNodes} initialEdges={initialEdges} />;
};
```

### 使用状态管理

```tsx
import { useWorkflowStore } from '@/components/workflow';

const WorkflowManager = () => {
  const { nodes, edges, updateNode } = useWorkflowStore();

  const handleApprove = (nodeId) => {
    updateNode(nodeId, { status: 'approved' });
  };

  return (
    <div>
      <BaseWorkflow initialNodes={nodes} initialEdges={edges} />
      <button onClick={() => handleApprove('node-1')}>批准</button>
    </div>
  );
};
```

### 导入/导出工作流

```tsx
import { exportWorkflow, importWorkflow } from '@/components/workflow';

const WorkflowIO = () => {
  const handleExport = () => {
    const json = exportWorkflow();
    console.log(json);
    // 可以进一步处理，如下载文件
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      importWorkflow(event.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <button onClick={handleExport}>导出工作流</button>
      <input type="file" onChange={handleImport} />
    </div>
  );
};
```

## 扩展方式

1. **添加新节点类型**
   - 在 `nodes/` 目录下创建新的节点组件
   - 在 `BaseWorkflow.tsx` 中注册新节点类型
   - 更新 `types.ts` 中的 `BusinessNodeType`

2. **自定义边样式**
   - 扩展 `CustomEdge.tsx` 或创建新的边组件
   - 在 `BaseWorkflow.tsx` 中注册新边类型

3. **增强状态管理**
   - 在 `workflowStore.ts` 中添加新的状态和方法

## 性能优化

- 使用 React.memo 减少不必要的重渲染
- 使用 Immer 进行不可变数据更新
- 大型工作流可开启 `onlyRenderVisibleElements` 选项