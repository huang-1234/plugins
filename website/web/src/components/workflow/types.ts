import type { Node, Edge } from '@xyflow/react';

export type BusinessNodeType =
  | 'start'
  | 'approval'
  | 'dataProcess'
  | 'end';

export interface BusinessNodeData {
  label: string;
  assignee?: string; // 审批人
  status: 'pending' | 'approved' | 'rejected';
  [key: string]: any;
}

export type BusinessNode = Node<BusinessNodeData>;
export type BusinessEdge = Edge<{ isRejected?: boolean }>;

export interface WorkflowState {
  nodes: BusinessNode[];
  edges: BusinessEdge[];
  updateNode: (id: string, data: Partial<BusinessNodeData>) => void;
  addNode: (node: BusinessNode) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: BusinessEdge) => void;
  removeEdge: (id: string) => void;
  setNodes: (nodes: BusinessNode[]) => void;
  setEdges: (edges: BusinessEdge[]) => void;
}