import { useCallback } from 'react';
import { OnNodesChange, OnEdgesChange, OnConnect, Node } from '@xyflow/react';
import { useWorkflowStore, BusinessNodeData, BusinessEdge } from '@/components/workflow';

export const useWorkflowControls = () => {
  // 添加调试日志
  console.log('useWorkflowControls: 初始化');

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    addNode: storeAddNode,
    updateNode,
    removeNode,
    addEdge: storeAddEdge,
    removeEdge
  } = useWorkflowStore();

  // 添加调试日志
  console.log('useWorkflowControls: 获取到 store 数据', { nodes, edges });

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      console.log('onNodesChange:', changes);
      // 处理节点变更
      changes.forEach(change => {
        if (change.type === 'remove') {
          removeNode(change.id);
        }
      });
    },
    [removeNode]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      console.log('onEdgesChange:', changes);
      // 处理边变更
      changes.forEach(change => {
        if (change.type === 'remove') {
          removeEdge(change.id);
        }
      });
    },
    [removeEdge]
  );

  const onConnect: OnConnect = useCallback(
    (params) => {
      console.log('onConnect:', params);
      // 创建新的边
      const newEdge = {
        ...params,
        id: `e-${params.source}-${params.target}`,
        type: 'custom',
        data: { isRejected: false }
      } as BusinessEdge;

      storeAddEdge(newEdge);
    },
    [storeAddEdge]
  );

  const addNode = useCallback(
    (node: Node<BusinessNodeData>) => {
      console.log('addNode:', node);
      storeAddNode(node);
    },
    [storeAddNode]
  );

  const updateNodeStatus = useCallback(
    (nodeId: string, status: 'pending' | 'approved' | 'rejected') => {
      console.log('updateNodeStatus:', nodeId, status);
      updateNode(nodeId, { status });
    },
    [updateNode]
  );

  const updateEdgeStatus = useCallback(
    (sourceId: string, targetId: string, isRejected: boolean) => {
      console.log('updateEdgeStatus:', sourceId, targetId, isRejected);
      const edgeId = `e-${sourceId}-${targetId}`;
      const edge = edges.find(e => e.id === edgeId);

      if (edge) {
        removeEdge(edgeId);
        storeAddEdge({
          ...edge,
          data: { ...edge.data, isRejected }
        });
      }
    },
    [edges, removeEdge, storeAddEdge]
  );

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNodeStatus,
    updateEdgeStatus
  };
};