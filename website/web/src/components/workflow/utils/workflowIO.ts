import useWorkflowStore from '../store/workflowStore';
import { BusinessNode, BusinessEdge } from '../types';

export const exportWorkflow = (): string => {
  const { nodes, edges } = useWorkflowStore.getState();
  return JSON.stringify({ nodes, edges }, null, 2);
};

export const importWorkflow = (json: string): void => {
  try {
    const data = JSON.parse(json) as { nodes: BusinessNode[], edges: BusinessEdge[] };
    useWorkflowStore.setState(data);
  } catch (error) {
    console.error('Failed to import workflow:', error);
  }
};

export const downloadWorkflow = (filename = 'workflow.json'): void => {
  const json = exportWorkflow();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};