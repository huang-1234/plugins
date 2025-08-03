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
  const prevNodesCountRef = useRef(0);
  const viewportStateRef = useRef({ zoom: 1, pan: { x: 0, y: 0 } });
  const prevElementsCountRef = useRef(0);

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

    // 记录当前节点数量，用于后续判断是否添加了新节点
    prevNodesCountRef.current = data.nodes.length;
  }, [data]);

  // 布局名称变更时，应用新布局
  useEffect(() => {
    if (!cyRef.current || prevLayoutNameRef.current === layoutName) return;

    prevLayoutNameRef.current = layoutName;

    // 如果布局名称变更，应用新布局
    const cy = cyRef.current;

    // 保存当前视图状态
    saveViewportState(cy);

    // 解锁所有节点以便重新布局
    cy.nodes().unlock();

    // 应用新布局
    const layoutConfig = createLayoutConfig(layoutName);
    const layout = cy.layout(layoutConfig);

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

      // 确保所有节点在视图范围内
      ensureNodesInViewport(cy);
    });
  }, [layoutName]);

  // 保存视图状态（缩放和平移）
  const saveViewportState = (cy: any) => {
    if (!cy) return;
    viewportStateRef.current = {
      zoom: cy.zoom(),
      pan: { ...cy.pan() }
    };
  };

  // 恢复视图状态
  const restoreViewportState = (cy: any) => {
    if (!cy) return;
    const { zoom, pan } = viewportStateRef.current;
    cy.zoom(zoom);
    cy.pan(pan);
  };

  // 防止节点重叠
  const preventNodeOverlap = (cy: any, targetNode?: any) => {
    const nodes = cy.nodes();
    const nodeRadius = 20; // 节点半径
    const minDistance = nodeRadius * 2.5; // 最小距离

    if (targetNode) {
      // 只检查目标节点与其他节点的重叠
      const otherNodes = nodes.not(targetNode);
      const posA = targetNode.position();

      otherNodes.forEach((nodeB: any) => {
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
  const ensureNodesInViewport = (cy: any, targetNode?: any) => {
    const padding = 50;

    if (targetNode) {
      // 只调整目标节点
      const pos = targetNode.position();
      const extent = cy.extent();
      const viewportMinX = extent.x1 + padding;
      const viewportMaxX = extent.x2 - padding;
      const viewportMinY = extent.y1 + padding;
      const viewportMaxY = extent.y2 - padding;

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
      // 保存当前视图状态
      saveViewportState(cy);

      // 调整所有节点，使用fit
      cy.fit(cy.elements(), padding);

      // 更新所有节点位置
      cy.nodes().forEach((node: any) => {
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

      // 保存当前视图状态
      saveViewportState(cy);
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

    // 视图变化事件（缩放、平移）
    cy.on('viewport', () => {
      // 保存视图状态
      saveViewportState(cy);
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

  // 找到新添加的节点
  const findNewNodes = (cy: any) => {
    return cy.nodes().filter((node: any) => !nodePositionsRef.current.has(node.id()));
  };

  // 为新节点找到合适的位置
  const positionNewNode = (cy: any, node: any) => {
    // 查找连接到此节点的其他节点
    const connectedEdges = node.connectedEdges();
    const connectedNodes = connectedEdges.connectedNodes().not(node);

    if (connectedNodes.length > 0) {
      // 如果有连接的节点，根据连接节点的位置计算新位置
      let avgX = 0;
      let avgY = 0;

      connectedNodes.forEach((connectedNode: any) => {
        const pos = connectedNode.position();
        avgX += pos.x;
        avgY += pos.y;
      });

      avgX /= connectedNodes.length;
      avgY /= connectedNodes.length;

      // 在连接节点的平均位置附近随机放置
      const offset = 100; // 偏移距离
      const randomAngle = Math.random() * 2 * Math.PI;
      const x = avgX + Math.cos(randomAngle) * offset;
      const y = avgY + Math.sin(randomAngle) * offset;

      node.position({ x, y });
    } else {
      // 如果没有连接的节点，放在视图中心附近随机位置
      const extent = cy.extent();
      const centerX = (extent.x1 + extent.x2) / 2;
      const centerY = (extent.y1 + extent.y2) / 2;

      // 在中心点附近随机放置
      const radius = 100;
      const randomAngle = Math.random() * 2 * Math.PI;
      const x = centerX + Math.cos(randomAngle) * radius;
      const y = centerY + Math.sin(randomAngle) * radius;

      node.position({ x, y });
    }

    // 保存新节点位置
    nodePositionsRef.current.set(node.id(), {
      x: node.position('x'),
      y: node.position('y')
    });
  };

  // 当组件获取到Cytoscape实例时
  const getCyRef = (cy: any) => {
    cyRef.current = cy;
    registerEventHandlers(cy);

    // 应用布局
    if (isFirstRender) {
      // 首次渲染，应用完整布局
      const layoutConfig = createLayoutConfig(layoutName);
      const layout = cy.layout(layoutConfig);

      layout.run();
      setIsFirstRender(false);

      // 布局完成后保存节点位置和视图状态
      layout.one('layoutstop', () => {
        cy.nodes().forEach((node: any) => {
          nodePositionsRef.current.set(node.id(), {
            x: node.position('x'),
            y: node.position('y')
          });
        });

        // 保存初始视图状态
        saveViewportState(cy);

        // 记录初始元素数量
        prevElementsCountRef.current = cy.elements().length;
      });
    } else if (preservePositions) {
      // 恢复已有节点的位置
      cy.nodes().forEach((node: any) => {
        const savedPosition = nodePositionsRef.current.get(node.id());
        if (savedPosition) {
          node.position(savedPosition);
        }
      });

      // 只对新节点应用布局
      const newNodes = findNewNodes(cy);
      if (newNodes.length > 0) {
        // 保存当前视图状态
        saveViewportState(cy);

        // 单独处理每个新节点，而不是使用布局算法
        newNodes.forEach((node: any) => {
          positionNewNode(cy, node);
        });

        // 防止新节点与现有节点重叠
        preventNodeOverlap(cy);

        // 检查是否添加了新节点（而不是切换数据集）
        const isNodeAddition = cy.elements().length > prevElementsCountRef.current;

        if (isNodeAddition) {
          // 如果是添加了新节点，确保所有节点都在视图中
          cy.fit(cy.elements(), 50);
        } else {
          // 如果是切换数据集，只关注新节点
          cy.fit(newNodes, 50);
        }

        // 更新元素计数
        prevElementsCountRef.current = cy.elements().length;

        // 更新新节点的位置
        cy.nodes().forEach((node: any) => {
          nodePositionsRef.current.set(node.id(), {
            x: node.position('x'),
            y: node.position('y')
          });
        });
      } else {
        // 如果没有新节点，恢复视图状态
        restoreViewportState(cy);
      }
    } else {
      // 不保留位置，应用完整布局
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

        // 保存视图状态
        saveViewportState(cy);

        // 更新元素计数
        prevElementsCountRef.current = cy.elements().length;
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
          cy={(cy) => getCyRef(cy)}
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