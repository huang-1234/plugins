import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce } from 'immer';
import { BusinessNode, BusinessEdge, WorkflowState } from '../types';

// 修复初始数据，确保边的源节点和目标节点都存在
export const graphDataMock = {
  nodes: [
    {
      id: '1',
      type: 'start',
      position: { x: 250, y: 100 },
      data: { label: '开始', status: 'approved' }
    },
    {
      id: '2',
      type: 'approval',
      position: { x: 250, y: 250 },
      data: { label: '审批', status: 'pending', assignee: '张三' }
    },
    {
      id: '3',
      type: 'dataProcess',
      position: { x: 250, y: 400 },
      data: { label: '数据处理', status: 'pending' }
    }
  ],
  edges: [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      type: 'custom'
    },
    {
      id: 'e2-3',
      source: '2',
      target: '3',
      type: 'custom'
    }
  ]
};

const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set) => ({
      nodes: graphDataMock.nodes as BusinessNode[],
      edges: graphDataMock.edges as BusinessEdge[],
      updateNode: (id, data) => set(state => ({
        nodes: produce(state.nodes, draft => {
          const node = draft.find(n => n.id === id);
          if (node) node.data = { ...node.data, ...data };
        })
      })),
      addNode: (node) => set(state => ({
        nodes: [...state.nodes, node]
      })),
      removeNode: (id) => set(state => ({
        nodes: state.nodes.filter(node => node.id !== id),
        edges: state.edges.filter(edge => edge.source !== id && edge.target !== id)
      })),
      addEdge: (edge) => set(state => ({
        edges: [...state.edges, edge]
      })),
      removeEdge: (id) => set(state => ({
        edges: state.edges.filter(edge => edge.id !== id)
      })),
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges })
    }),
    { name: 'workflow-storage' } // 自动存 localStorage
  )
);

export default useWorkflowStore;