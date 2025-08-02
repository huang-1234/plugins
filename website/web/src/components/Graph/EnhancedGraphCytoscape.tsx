import React, { useCallback, useEffect, useState } from 'react';
import GraphCytoscape, { GraphCytoscapeProps } from './GraphCytoscape';
import { GraphNode, GraphEdge } from '@/model/graph/tool';
import ContextMenu from './ContextMenu';
import styles from './GraphCytoscape.module.less';

interface EnhancedGraphCytoscapeProps extends GraphCytoscapeProps {
  onNodeContextMenu?: (nodeId: string, x: number, y: number) => void;
  onAddOutgoingEdge?: (nodeId: string) => void;
  onAddIncomingEdge?: (nodeId: string) => void;
}

const EnhancedGraphCytoscape: React.FC<EnhancedGraphCytoscapeProps> = ({
  data,
  onNodeClick,
  onNodeContextMenu,
  onAddOutgoingEdge,
  onAddIncomingEdge,
  ...restProps
}) => {
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    nodeId: ''
  });

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
    cy.on('cxttap', 'node', handleNodeRightClick);

    // 清除之前可能存在的事件处理器
    return () => {
      cy.removeListener('cxttap', 'node', handleNodeRightClick);
    };
  }, [handleNodeRightClick]);

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
        onNodeClick={handleNodeClick}
        onGraphReady={handleGraphReady}
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