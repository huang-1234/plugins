import React, { useCallback, useState, DragEvent, useRef } from 'react';
import { ReactFlowProvider, ReactFlowInstance, Node } from '@xyflow/react';
import BaseWorkflow from '@/components/workflow/BaseWorkflow';
import { useWorkflowControls } from './hooks/useWorkflowControls';
import WorkflowSidebar from './components/WorkflowSidebar';
import WorkflowToolbar from './components/WorkflowToolbar';
import { BusinessNodeData } from '@/components/workflow/types';
import '@xyflow/react/dist/style.css';
import styles from './index.module.less';

export const WorkFlow = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteElements
  } = useWorkflowControls();

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // 处理拖拽放置 - 优化拖拽创建节点
  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type) {
        console.log('No node type found in drop event');
        return;
      }

      // 计算节点放置位置
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

      console.log('Creating new node:', newNode);
      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );

  // 允许放置
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // 处理删除选中元素
  const handleDeleteSelected = useCallback(() => {
    if (!reactFlowInstance) return;

    const selectedNodes = reactFlowInstance.getNodes().filter(node => node.selected) as Node<BusinessNodeData>[];
    const selectedEdges = reactFlowInstance.getEdges().filter(edge => edge.selected);

    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      deleteElements({ nodes: selectedNodes, edges: selectedEdges });
    }
  }, [reactFlowInstance, deleteElements]);

  // 处理添加节点
  const handleAddNode = useCallback(() => {
    if (!reactFlowInstance) return;

    // 获取视图中心点
    const { x, y } = reactFlowInstance.getViewport();

    // 创建新节点
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'approval',
      position: { x: -x + 200, y: -y + 200 },
      data: {
        label: 'New Node',
        status: 'pending' as const
      },
    };

    addNode(newNode);
  }, [reactFlowInstance, addNode]);

  // 处理自动布局
  const handleAutoLayout = useCallback(() => {
    console.log('Auto layout triggered');
    // 这里可以实现自动布局逻辑
    // 例如使用 dagre 或其他布局算法
  }, []);

  return (
    <div className={styles.pageContainer}>
      <ReactFlowProvider>
        <div className={styles.workflowContainer}>
          <WorkflowSidebar />
          <div className={styles.workflowContent}>
            <WorkflowToolbar
              onDeleteSelected={handleDeleteSelected}
              onAddNode={handleAddNode}
              onAutoLayout={handleAutoLayout}
            />
            <div
              ref={reactFlowWrapper}
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
                onDeleteSelected={handleDeleteSelected}
                onAddNode={handleAddNode}
                onAutoLayout={handleAutoLayout}
              />
            </div>
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default React.memo(WorkFlow);