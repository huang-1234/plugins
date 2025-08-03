import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// 确保样式被正确加载
import './styles.css';

// Export all components
export { default as BaseWorkflow } from './BaseWorkflow';
export { default as BusinessNode } from './nodes/BusinessNode';
export { default as ApprovalNode } from './nodes/ApprovalNode';
export { default as CustomEdge } from './edges/CustomEdge';
export { default as useWorkflowStore } from './store/workflowStore';
export { default as useConnectionValidator } from './hooks/useConnectionValidator';
export * from './types';
export * from './utils/workflowIO';