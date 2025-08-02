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
  const [elements, setElements] = useState<any[]>([]);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const nodePositionsRef = useRef(new Map());
  const prevLayoutNameRef = useRef(layoutName);

  // 处理数据变化，转换为Cytoscape元素格式
  useEffect(() => {
    if (!data || !data.nodes || !data.edges) return;

    // 处理节点数据，添加颜色属性
    const processedData = {
      nodes: processNodeData(data.nodes),
      edges: data.edges
    };

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
    const layout = cy.layout({
      name: layoutName,
      animate: true,
      animationDuration: 500,
      fit: true,
      padding: 30,
      ...createLayoutConfig(layoutName)
    });

    layout.run();

    // 布局完成后锁定节点
    layout.one('layoutstop', () => {
      cy.nodes().lock();
    });
  }, [layoutName]);

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
  const getCyRef = (cy: any) => {
    cyRef.current = cy;
    registerEventHandlers(cy);

    // 应用布局
    if (isFirstRender) {
      const layout = cy.layout(createLayoutConfig(layoutName));
      layout.run();
      setIsFirstRender(false);

      // 布局完成后锁定节点
      layout.one('layoutstop', () => {
        cy.nodes().lock();
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
      const newNodes = cy.nodes().filter((node: any) => !nodePositionsRef.current.has(node.id()));
      if (newNodes.length > 0) {
        const layout = newNodes.layout({
          name: layoutName,
          animate: false,
          fit: false
        });
        layout.run();

        // 布局完成后锁定节点
        layout.one('layoutstop', () => {
          cy.nodes().lock();
        });
      }
    } else {
      const layout = cy.layout(createLayoutConfig(layoutName));
      layout.run();

      // 布局完成后锁定节点
      layout.one('layoutstop', () => {
        cy.nodes().lock();
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