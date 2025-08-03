import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  ReactFlowInstance
} from '@xyflow/react';

import ApprovalNode from './nodes/ApprovalNode';
import BusinessNode from './nodes/BusinessNode';
import CustomEdge from './edges/CustomEdge';
import useConnectionValidator from './hooks/useConnectionValidator';
import { BusinessNodeData } from './types';

interface BaseWorkflowProps {
  initialNodes?: Node<BusinessNodeData>[];
  initialEdges?: Edge[];
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  onInit?: (instance: ReactFlowInstance) => void;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const BaseWorkflow: React.FC<BaseWorkflowProps> = ({
  initialNodes = [],
  initialEdges = [],
  onNodesChange: externalOnNodesChange,
  onEdgesChange: externalOnEdgesChange,
  onConnect: externalOnConnect,
  onInit,
  readOnly = false,
  className,
  style
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { isValidConnection } = useConnectionValidator();

  // 注册所有节点类型
  const nodeTypes: NodeTypes = {
    start: BusinessNode,
    approval: ApprovalNode,
    dataProcess: BusinessNode,
    end: BusinessNode
  };

  const edgeTypes: EdgeTypes = {
    custom: CustomEdge,
    default: CustomEdge
  };

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      if (externalOnNodesChange) externalOnNodesChange(changes);
    },
    [onNodesChange, externalOnNodesChange]
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      if (externalOnEdgesChange) externalOnEdgesChange(changes);
    },
    [onEdgesChange, externalOnEdgesChange]
  );

  const handleConnect: OnConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge({ ...params, type: 'custom' }, eds));
      if (externalOnConnect) externalOnConnect(params);
    },
    [setEdges, externalOnConnect]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onConnect={handleConnect}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      isValidConnection={isValidConnection}
      fitView
      className={className}
      style={{ ...style, width: '100%', height: '100%' }}
      nodesDraggable={!readOnly}
      nodesConnectable={!readOnly}
      elementsSelectable={!readOnly}
      onInit={onInit}
      proOptions={{ hideAttribution: true }}
    >
      <Background />
      <Controls />
      <MiniMap />
      <Panel position="top-right">
        {/* 可以在这里添加自定义控制面板 */}
      </Panel>
    </ReactFlow>
  );
};

export default React.memo(BaseWorkflow);