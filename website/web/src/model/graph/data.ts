import { GraphData } from "./tool";

// 示例图数据 - 简单流程图
export const sampleData: GraphData = {
  nodes: [
    { id: 'start', label: '开始节点', status: 'success' },
    { id: 'process', label: '处理节点', status: 'running' },
    { id: 'process2', label: '处理节点2', status: 'running' },
    { id: 'process3', label: '处理节点3', status: 'running' },
    { id: 'process4', label: '处理节点4', status: 'running' },
    { id: 'process5', label: '处理节点5', status: 'running' },
    { id: 'process6', label: '处理节点6', status: 'running' },
    { id: 'process7', label: '处理节点7', status: 'running' },
    { id: 'process8', label: '处理节点8', status: 'running' },
    { id: 'process9', label: '处理节点9', status: 'running' },
    { id: 'process10', label: '处理节点10', status: 'running' },
    { id: 'process11', label: '处理节点11', status: 'running' },
    { id: 'process12', label: '处理节点12', status: 'running' },
    { id: 'process13', label: '处理节点13', status: 'running' },
    { id: 'process14', label: '处理节点14', status: 'running' },
    { id: 'process15', label: '处理节点15', status: 'running' },
    { id: 'process16', label: '处理节点16', status: 'running' },
    { id: 'process17', label: '处理节点17', status: 'running' },
    { id: 'decision', label: '决策节点' },
    { id: 'end_success', label: '成功结束', status: 'success' },
    { id: 'end_error', label: '错误处理', status: 'failed' }
  ],
  edges: [
    { source: 'start', target: 'process', weight: 1 },
    { source: 'process', target: 'process2', weight: 1 },
    { source: 'process2', target: 'process3', weight: 1 },
    { source: 'process3', target: 'process4', weight: 1 },
    { source: 'process4', target: 'process5', weight: 1 },
    { source: 'process5', target: 'process6', weight: 1 },
    { source: 'process6', target: 'process7', weight: 1 },
    { source: 'process7', target: 'process8', weight: 1 },
    { source: 'process8', target: 'process9', weight: 1 },
    { source: 'process9', target: 'process10', weight: 1 },
    { source: 'process10', target: 'process11', weight: 1 },
    { source: 'process11', target: 'process12', weight: 1 },
    { source: 'process12', target: 'process13', weight: 1 },
    { source: 'process13', target: 'process14', weight: 1 },
    { source: 'process14', target: 'process15', weight: 1 },
    { source: 'process15', target: 'process16', weight: 1 },
    { source: 'process16', target: 'process17', weight: 1 },
    { source: 'process17', target: 'decision', weight: 1 },
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
    { id: 'planningExecution', label: '任务规划执行', status: 'running' },
    { id: 'execution', label: '执行操作' },
    { id: 'output', label: '输出生成' }
  ],
  edges: [
    { source: 'input', target: 'retrieval', type: 'flow' },
    { source: 'input', target: 'reasoning', type: 'flow' },
    { source: 'retrieval', target: 'reasoning', type: 'data' },
    { source: 'reasoning', target: 'planning', type: 'flow' },
    { source: 'planning', target: 'planningExecution', type: 'flow' },
    { source: 'planningExecution', target: 'execution', type: 'flow' },
    { source: 'execution', target: 'output', type: 'flow' },
    { source: 'reasoning', target: 'output', type: 'data' }
  ]
};
