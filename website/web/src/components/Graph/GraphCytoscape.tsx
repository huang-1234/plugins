import React, { useEffect, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import * as cytoscape from 'cytoscape';
import {
  GraphData,
  GraphNode,
  GraphEdge,
  convertAdjListToCytoscape,
  createBaseStyles,
  createLayoutConfig,
  processNodeData
} from '../../model/graph/tool';
import styles from './GraphCytoscape.module.less';

export interface GraphCytoscapeProps {
  data: GraphData;
  layoutName?: string;
  style?: React.CSSProperties;
  height?: number | string;
  width?: number | string;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  onGraphReady?: (cy: cytoscape.Core) => void;
  preservePositions?: boolean;
}

/**
 * 基于Cytoscape.js的React图可视化组件
 * 支持邻接表数据结构和LangGraph框架集成
 */
const GraphCytoscape: React.FC<GraphCytoscapeProps> = ({
  data,
  layoutName = 'cose',
  style,
  height = 600,
  width = '100%',
  onNodeClick,
  onEdgeClick,
  onGraphReady,
  preservePositions = true
}) => {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [elements, setElements] = useState<cytoscape.ElementDefinition[]>([]);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const nodePositionsRef = useRef(new Map());
  const prevLayoutNameRef = useRef(layoutName);
  const draggedNodeRef = useRef<any>(null);

  // 处理数据变化，转换为Cytoscape元素格式
  useEffect(() => {
    if (!data || !data.nodes || !data.edges) return;

    // 处理节点数据，添加颜色属性
    const processedData = {
      nodes: processNodeData(data.nodes),
      edges: data.edges
    };
    console.log('processedData', processedData);

    // 转换为Cytoscape元素格式
    const cytoscapeElements = convertAdjListToCytoscape(processedData);
    setElements(cytoscapeElements);
  }, [data]);

  // 布局名称变更时，应用新布局
  useEffect(() => {
    if (!cyRef.current || prevLayoutNameRef.current === layoutName) return;

    prevLayoutNameRef.current = layoutName;

    // 如果布局名称变更，应用新布局
    const cy = cyRef.current;

    // 解锁所有节点以便重新布局
    cy.nodes().unlock();

    // 应用新布局
    const layout = cy.layout(createLayoutConfig(layoutName));

    layout.run();

    // 布局完成后锁定节点
    layout.one('layoutstop', () => {
      // 不锁定节点，允许拖动
      // cy.nodes().lock();

      // 保存节点位置
      cy.nodes().forEach((node: any) => {
        nodePositionsRef.current.set(node.id(), {
          x: node.position('x'),
          y: node.position('y')
        });
      });
    });
  }, [layoutName]);

  // 防止节点重叠
  const preventNodeOverlap = (cy: cytoscape.Core, targetNode?: cytoscape.NodeSingular) => {
    const nodes = cy.nodes();
    const nodeRadius = 20; // 节点半径
    const minDistance = nodeRadius * 2.5; // 最小距离

    if (targetNode) {
      // 只检查目标节点与其他节点的重叠
      const otherNodes = nodes.not(targetNode);
      const posA = targetNode.position();

      otherNodes.forEach((nodeB: cytoscape.NodeSingular) => {
        const posB = nodeB.position();

        // 计算两节点间距离
        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 如果距离小于最小距离，调整位置
        if (distance < minDistance) {
          // 计算移动方向
          const angle = Math.atan2(dy, dx);
          const moveX = (minDistance - distance) * Math.cos(angle);
          const moveY = (minDistance - distance) * Math.sin(angle);

          // 只移动目标节点
          targetNode.position({
            x: posA.x - moveX,
            y: posA.y - moveY
          });
        }
      });
    } else {
      // 检查所有节点对
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        const posA = nodeA.position();

        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const posB = nodeB.position();

          // 计算两节点间距离
          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // 如果距离小于最小距离，调整位置
          if (distance < minDistance) {
            // 计算移动方向
            const angle = Math.atan2(dy, dx);
            const moveX = (minDistance - distance) * Math.cos(angle) * 0.5;
            const moveY = (minDistance - distance) * Math.sin(angle) * 0.5;

            // 移动两个节点
            nodeA.position({
              x: posA.x - moveX,
              y: posA.y - moveY
            });

            nodeB.position({
              x: posB.x + moveX,
              y: posB.y + moveY
            });
          }
        }
      }
    }

    // 保存调整后的节点位置
    nodes.forEach((node: any) => {
      nodePositionsRef.current.set(node.id(), {
        x: node.position('x'),
        y: node.position('y')
      });
    });
  };

  // 确保节点在视图范围内
  const ensureNodesInViewport = (cy: cytoscape.Core, targetNode?: cytoscape.NodeSingular) => {
    const padding = 50;
    const extent = cy.extent();
    const viewportMinX = extent.x1 + padding;
    const viewportMaxX = extent.x2 - padding;
    const viewportMinY = extent.y1 + padding;
    const viewportMaxY = extent.y2 - padding;

    if (targetNode) {
      // 只调整目标节点
      const pos = targetNode.position();
      let newX = pos.x;
      let newY = pos.y;

      if (pos.x < viewportMinX) newX = viewportMinX;
      if (pos.x > viewportMaxX) newX = viewportMaxX;
      if (pos.y < viewportMinY) newY = viewportMinY;
      if (pos.y > viewportMaxY) newY = viewportMaxY;

      if (newX !== pos.x || newY !== pos.y) {
        targetNode.position({ x: newX, y: newY });
        nodePositionsRef.current.set(targetNode.id(), { x: newX, y: newY });
      }
    } else {
      // 调整所有节点，使用fit
      cy.fit(cy.elements(), padding);

      // 更新所有节点位置
      cy.nodes().forEach((node: cytoscape.NodeSingular) => {
        const pos = node.position();
        nodePositionsRef.current.set(node.id(), { x: pos.x, y: pos.y });
      });
    }
  };

  // 注册Cytoscape事件处理
  const registerEventHandlers = (cy: cytoscape.Core) => {
    // 节点点击事件
    cy.on('tap', 'node', (event) => {
      const node = event.target.data();
      if (onNodeClick) onNodeClick(node);
    });

    // 边点击事件
    cy.on('tap', 'edge', (event) => {
      const edge = event.target.data();
      if (onEdgeClick) onEdgeClick(edge);
    });

    // 节点拖动开始
    cy.on('grab', 'node', (e) => {
      const node = e.target;
      draggedNodeRef.current = node;
    });

    // 节点拖动结束
    cy.on('free', 'node', (e) => {
      const node = e.target;

      // 防止节点重叠和确保在视图内
      preventNodeOverlap(cy, node);
      ensureNodesInViewport(cy, node);

      // 重置拖动节点引用
      draggedNodeRef.current = null;
    });

    // 保存节点位置
    if (preservePositions) {
      cy.on('position', 'node', (event) => {
        const node = event.target;
        nodePositionsRef.current.set(node.id(), {
          x: node.position('x'),
          y: node.position('y')
        });
      });
    }

    // 提供Cytoscape实例给外部使用
    if (onGraphReady) onGraphReady(cy);
  };

  // 当组件获取到Cytoscape实例时
  const getCyRef = (cy: cytoscape.Core) => {
    cyRef.current = cy;
    registerEventHandlers(cy);

    // 应用布局
    if (isFirstRender) {
      const layout = cy.layout(createLayoutConfig(layoutName));
      layout.run();
      setIsFirstRender(false);

      // 布局完成后保存节点位置，但不锁定节点
      layout.one('layoutstop', () => {
        cy.nodes().forEach((node: cytoscape.NodeSingular) => {
          nodePositionsRef.current.set(node.id(), {
            x: node.position('x'),
            y: node.position('y')
          });
        });
      });
    } else if (preservePositions) {
      // 恢复已有节点的位置
      cy.nodes().forEach((node: cytoscape.NodeSingular) => {
        const savedPosition = nodePositionsRef.current.get(node.id());
        if (savedPosition) {
          node.position(savedPosition);
        }
      });

      // 只对新节点应用布局
      const newNodes = cy.nodes().filter((node: any) => !nodePositionsRef.current.has(node.id()));
      if (newNodes.length > 0) {
        const layout = newNodes.layout({
          name: layoutName,
          animate: false,
          fit: false
        });
        layout.run();

        // 布局完成后保存节点位置
        layout.one('layoutstop', () => {
          newNodes.forEach((node: any) => {
            nodePositionsRef.current.set(node.id(), {
              x: node.position('x'),
              y: node.position('y')
            });
          });

          // 防止新节点与现有节点重叠
          preventNodeOverlap(cy);
        });
      }
    } else {
      const layout = cy.layout(createLayoutConfig(layoutName));
      layout.run();

      // 布局完成后保存节点位置
      layout.one('layoutstop', () => {
        cy.nodes().forEach((node: any) => {
          nodePositionsRef.current.set(node.id(), {
            x: node.position('x'),
            y: node.position('y')
          });
        });
      });
    }
  };

  // 组件样式
  const containerStyle: React.CSSProperties = {
    width: width,
    height: height,
    ...style
  };

  return (
    <div className={styles.graphContainer} style={containerStyle}>
      {elements.length > 0 ? (
        <CytoscapeComponent
          key={`graph-${elements.length}-${layoutName}`}
          elements={elements as any}
          className={styles.graphContent}
          cy={getCyRef}
          stylesheet={createBaseStyles() as any}
          userZoomingEnabled={true}
          userPanningEnabled={true}
          boxSelectionEnabled={true}
        />
      ) : null}
    </div>
  );
};

export default React.memo(GraphCytoscape);