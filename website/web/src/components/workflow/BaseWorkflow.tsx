import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  ReactFlowInstance,
  NodeMouseHandler,
  XYPosition,
  Connection,
  NodeChange,
  EdgeChange
} from '@xyflow/react';

import ApprovalNode from './nodes/ApprovalNode';
import BusinessNode from './nodes/BusinessNode';
import CustomEdge from './edges/CustomEdge';
import useConnectionValidator from './hooks/useConnectionValidator';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { BusinessNodeData } from './types';
import { Dropdown } from 'antd';
import NodeContextMenu from './components/NodeContextMenu';

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
  onDeleteSelected?: () => void;
  onAddNode?: () => void;
  onAutoLayout?: () => void;
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
  style,
  onDeleteSelected,
  onAddNode,
  onAutoLayout
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<BusinessNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const { isValidConnection } = useConnectionValidator();

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    node: Node<BusinessNodeData>;
    position: XYPosition;
  } | null>(null);

  // 注册所有节点类型
  const nodeTypes = {
    start: BusinessNode,
    approval: ApprovalNode,
    dataProcess: BusinessNode,
    end: BusinessNode
  } as NodeTypes;

  const edgeTypes = {
    custom: CustomEdge,
    default: CustomEdge
  } as EdgeTypes;

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes as NodeChange<Node<BusinessNodeData>>[]);
      if (externalOnNodesChange) externalOnNodesChange(changes);
    },
    [onNodesChange, externalOnNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      if (externalOnEdgesChange) externalOnEdgesChange(changes);
    },
    [onEdgesChange, externalOnEdgesChange]
  );

  const handleConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: 'custom' }, eds));
      if (externalOnConnect) externalOnConnect(params);
    },
    [setEdges, externalOnConnect]
  );

  // 处理节点右键点击 - 修复位置问题
  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      // 阻止默认的上下文菜单
      event.preventDefault();

      // 获取节点元素的位置和尺寸
      const nodeElement = event.target as Element;
      const nodeRect = nodeElement.getBoundingClientRect();

      // 计算右键菜单的位置，放在节点的正下方
      setContextMenu({
        node: node as Node<BusinessNodeData>,
        position: {
          x: nodeRect.left + nodeRect.width / 2, // 节点中心点的x坐标
          y: nodeRect.bottom + 5 // 节点底部下方5px
        },
      });
    },
    [setContextMenu]
  );

  // 关闭上下文菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 删除节点
  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    [setNodes, setEdges]
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
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  // 添加连接
  const addNodeEdge = useCallback(
    (sourceId: string) => {
      // 这里可以实现添加连接的逻辑，例如进入连接模式
      console.log('Add edge from', sourceId);
      // 这里可以实现进入连接模式的逻辑
    },
    []
  );

  // 编辑节点
  const editNode = useCallback(
    (nodeId: string) => {
      // 这里可以实现编辑节点的逻辑，例如打开编辑弹窗
      console.log('Edit node', nodeId);
    },
    []
  );

  // 删除选中的元素
  const deleteElements = useCallback(
    ({ nodes: nodesToDelete, edges: edgesToDelete }: {
      nodes: Node<BusinessNodeData>[];
      edges: Edge[]
    }) => {
      setNodes((nds) =>
        nds.filter((n) => !nodesToDelete.some((node) => node.id === n.id))
      );
      setEdges((eds) =>
        eds.filter((e) => !edgesToDelete.some((edge) => edge.id === e.id))
      );

      // 通知外部组件删除操作已执行
      if (onDeleteSelected) {
        onDeleteSelected();
      }
    },
    [setNodes, setEdges, onDeleteSelected]
  );

  // 注册键盘快捷键
  useKeyboardShortcuts({
    deleteElements,
    duplicateNode,
  });

  // 点击画布时关闭上下文菜单
  const onPaneClick = useCallback(() => {
    closeContextMenu();
  }, [closeContextMenu]);

  // 自定义连接验证函数
  const validateConnection = useCallback((connection: Connection) => {
    return isValidConnection(connection);
  }, [isValidConnection]);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        isValidConnection={validateConnection}
        fitView
        className={className}
        style={{ ...style, width: '100%', height: '100%' }}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        onInit={onInit as any}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        deleteKeyCode={['Delete', 'Backspace']} // 启用删除键
        multiSelectionKeyCode={['Control', 'Meta']} // 启用多选
        selectionKeyCode={['Shift']} // 启用框选
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          {/* 可以在这里添加自定义控制面板 */}
        </Panel>
      </ReactFlow>

      {/* 节点右键菜单 - 修复位置问题 */}
      {contextMenu && (
        <div
          style={{
            position: 'absolute',
            left: `${contextMenu.position.x - 75}px`, // 水平居中显示
            top: `${contextMenu.position.y}px`,
            zIndex: 1000,
          }}
        >
          <Dropdown
            open={true}
            onOpenChange={(visible) => {
              if (!visible) closeContextMenu();
            }}
            dropdownRender={() => (
              <NodeContextMenu
                node={contextMenu.node}
                onClose={closeContextMenu}
                onDelete={deleteNode}
                onDuplicate={duplicateNode}
                onAddEdge={addNodeEdge}
                onEdit={editNode}
              />
            )}
          >
            <div />
          </Dropdown>
        </div>
      )}
    </>
  );
};

export default React.memo(BaseWorkflow);