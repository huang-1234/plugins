import React, { useCallback, useState, DragEvent } from 'react';
import { ReactFlowProvider, ReactFlowInstance } from '@xyflow/react';
import BaseWorkflow from '@/components/workflow/BaseWorkflow';
import { useWorkflowControls } from './hooks/useWorkflowControls';
import WorkflowSidebar from './components/WorkflowSidebar';
import WorkflowToolbar from './components/WorkflowToolbar';
import '@xyflow/react/dist/style.css';
import styles from './index.module.less';

export const WorkFlow = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode
  } = useWorkflowControls();
  console.log('WorkFlow: nodes', nodes);
  console.log('WorkFlow: edges', edges);

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const reactFlowBounds = (event.target as Element).closest('.react-flow')?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // 创建新节点
      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          status: 'pending' as const
        },
      };

      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className={styles.pageContainer}>
      <ReactFlowProvider>
        <div className={styles.workflowContainer}>
          <WorkflowSidebar />
          <div className={styles.workflowContent}>
            <WorkflowToolbar />
            <div
              className={styles.reactFlowWrapper}
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              <BaseWorkflow
                initialNodes={nodes}
                initialEdges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                className={styles.reactFlow}
                onInit={setReactFlowInstance}
              />
            </div>
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default React.memo(WorkFlow);