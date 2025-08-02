import React, { useCallback, useEffect, useState, useRef } from 'react';
import GraphCytoscape, { GraphCytoscapeProps } from './GraphCytoscape';
import { GraphNode } from '@/model/graph/tool';
import ContextMenu from './ContextMenu';
import styles from './GraphCytoscape.module.less';

interface EnhancedGraphCytoscapeProps extends GraphCytoscapeProps {
  onNodeContextMenu?: (nodeId: string, x: number, y: number) => void;
  onAddOutgoingEdge?: (nodeId: string) => void;
  onAddIncomingEdge?: (nodeId: string) => void;
}

const EnhancedGraphCytoscape: React.FC<EnhancedGraphCytoscapeProps> = ({
  data,
  layoutName = 'cose',
  onNodeClick,
  onNodeContextMenu,
  onAddOutgoingEdge,
  onAddIncomingEdge,
  onGraphReady,
  ...restProps
}) => {
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    nodeId: ''
  });
  const [cyInstance, setCyInstance] = useState<any>(null);
  const draggedNodeRef = useRef<any>(null);

  // 处理节点右键点击
  const handleNodeRightClick = useCallback((event: any) => {
    // 阻止默认右键菜单
    event.originalEvent.preventDefault();

    const node = event.target;
    const position = event.renderedPosition || event.position;
    const nodeId = node.id();

    // 显示自定义上下文菜单
    setContextMenu({
      visible: true,
      x: position.x,
      y: position.y,
      nodeId: nodeId
    });

    // 调用外部回调
    if (onNodeContextMenu) {
      onNodeContextMenu(nodeId, position.x, position.y);
    }
  }, [onNodeContextMenu]);

  // 注册右键菜单事件
  const handleGraphReady = useCallback((cy: any) => {
    setCyInstance(cy);
    cy.on('cxttap', 'node', handleNodeRightClick);

    // 节点拖动开始
    cy.on('grab', 'node', (e: any) => {
      const node = e.target;
      draggedNodeRef.current = node;
    });

    // 监听视图变化
    cy.on('viewport', () => {
      // 关闭上下文菜单
      closeContextMenu();
    });

    // 调用外部回调
    if (onGraphReady) {
      onGraphReady(cy);
    }

    // 清除之前可能存在的事件处理器
    return () => {
      cy.removeListener('cxttap', 'node', handleNodeRightClick);
    };
  }, [handleNodeRightClick, onGraphReady]);

  // 关闭上下文菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // 处理添加出度节点
  const handleAddOutgoingEdge = useCallback((nodeId: string) => {
    if (onAddOutgoingEdge) {
      onAddOutgoingEdge(nodeId);
    }
  }, [onAddOutgoingEdge]);

  // 处理添加入度节点
  const handleAddIncomingEdge = useCallback((nodeId: string) => {
    if (onAddIncomingEdge) {
      onAddIncomingEdge(nodeId);
    }
  }, [onAddIncomingEdge]);

  // 点击节点时关闭上下文菜单
  const handleNodeClick = useCallback((node: GraphNode) => {
    closeContextMenu();
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick, closeContextMenu]);

  return (
    <div className={styles.enhancedGraphContainer}>
      <GraphCytoscape
        {...restProps}
        data={data}
        layoutName={layoutName}
        onNodeClick={handleNodeClick}
        onGraphReady={handleGraphReady}
        preservePositions={true} // 始终保持位置
      />
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        nodeId={contextMenu.nodeId}
        onClose={closeContextMenu}
        onAddOutgoingEdge={handleAddOutgoingEdge}
        onAddIncomingEdge={handleAddIncomingEdge}
      />
    </div>
  );
};

export default EnhancedGraphCytoscape;