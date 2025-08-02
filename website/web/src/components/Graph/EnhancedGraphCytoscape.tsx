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

    // 禁用自动布局重排
    cy.on('grab', 'node', (e: any) => {
      // 当用户开始拖动节点时，锁定其他节点位置
      cy.nodes().not(e.target).lock();
    });

    cy.on('free', 'node', () => {
      // 当用户释放节点时，解锁所有节点
      cy.nodes().unlock();

      // 然后重新锁定所有节点，防止其他操作导致位置变化
      setTimeout(() => {
        cy.nodes().lock();
      }, 50);
    });

    // 初始布局完成后锁定所有节点位置
    cy.one('layoutstop', () => {
      cy.nodes().lock();
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

  // 数据更新时，应用布局但保持现有节点位置
  useEffect(() => {
    if (!cyInstance) return;

    // 获取现有节点位置
    const nodePositions = new Map();
    cyInstance.nodes().forEach((node: any) => {
      nodePositions.set(node.id(), {
        x: node.position('x'),
        y: node.position('y')
      });
    });

    // 对于新添加的节点，应用布局
    const newNodes = cyInstance.nodes().filter((node: any) => !nodePositions.has(node.id()));

    if (newNodes.length > 0) {
      // 解锁所有节点以便布局
      cyInstance.nodes().unlock();

      // 只对新节点应用布局
      const layout = newNodes.layout({
        name: layoutName,
        animate: false,
        randomize: true,
        fit: false
      });
      layout.run();

      // 布局完成后锁定所有节点
      setTimeout(() => {
        cyInstance.nodes().lock();
      }, 100);
    }
  }, [data, cyInstance, layoutName]);

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