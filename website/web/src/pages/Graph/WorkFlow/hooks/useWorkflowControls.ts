import { useCallback } from 'react';
import { OnNodesChange, OnEdgesChange, OnConnect, Node, Edge } from '@xyflow/react';
import { useWorkflowStore, BusinessNodeData, BusinessEdge } from '@/components/workflow';

export const useWorkflowControls = () => {

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
        } else if (change.type === 'position' && change.position) {
          // 处理节点位置变更
          const node = nodes.find(n => n.id === change.id);
          if (node) {
            const updatedNode = {
              ...node,
              position: change.position
            };
            setNodes(nodes.map(n => n.id === change.id ? updatedNode : n));
          }
        }
      });
    },
    [removeNode, nodes, setNodes]
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

  // 删除选中的元素
  const deleteElements = useCallback(
    ({ nodes: nodesToDelete, edges: edgesToDelete }: {
      nodes: Node<BusinessNodeData>[];
      edges: Edge[];
    }) => {
      console.log('deleteElements:', { nodesToDelete, edgesToDelete });

      // 删除节点
      nodesToDelete.forEach((node: Node<BusinessNodeData>) => {
        removeNode(node.id);
      });

      // 删除边
      edgesToDelete.forEach((edge: Edge) => {
        removeEdge(edge.id);
      });
    },
    [removeNode, removeEdge]
  );

  // 复制节点
  const duplicateNode = useCallback(
    (node: Node<BusinessNodeData>) => {
      const newNode = {
        ...node,
        id: `${node.type}-${Date.now()}`,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        selected: false,
      };
      storeAddNode(newNode);
    },
    [storeAddNode]
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
    updateEdgeStatus,
    deleteElements,
    duplicateNode
  };
};