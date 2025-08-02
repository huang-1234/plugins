import { GraphData } from "./tool";

// 示例图数据 - 简单流程图
export const sampleData: GraphData = {
  nodes: [
    { id: 'start', label: '开始节点', status: 'success' },
    { id: 'process', label: '处理节点', status: 'running' },
    { id: 'decision', label: '决策节点' },
    { id: 'end_success', label: '成功结束', status: 'success' },
    { id: 'end_error', label: '错误处理', status: 'failed' }
  ],
  edges: [
    { source: 'start', target: 'process', weight: 1 },
    { source: 'process', target: 'decision', weight: 1 },
    { source: 'decision', target: 'end_success', weight: 0.7, type: 'success' },
    { source: 'decision', target: 'end_error', weight: 0.3, type: 'error' }
  ]
};

// 示例图数据 - LangGraph风格
export const langGraphData: GraphData = {
  nodes: [
    { id: 'input', label: '输入解析', status: 'success' },
    { id: 'retrieval', label: '知识检索', status: 'success' },
    { id: 'reasoning', label: '推理分析', status: 'running' },
    { id: 'planning', label: '任务规划', status: 'running' },
    { id: 'execution', label: '执行操作' },
    { id: 'output', label: '输出生成' }
  ],
  edges: [
    { source: 'input', target: 'retrieval', type: 'flow' },
    { source: 'input', target: 'reasoning', type: 'flow' },
    { source: 'retrieval', target: 'reasoning', type: 'data' },
    { source: 'reasoning', target: 'planning', type: 'flow' },
    { source: 'planning', target: 'execution', type: 'flow' },
    { source: 'execution', target: 'output', type: 'flow' },
    { source: 'reasoning', target: 'output', type: 'data' }
  ]
};
