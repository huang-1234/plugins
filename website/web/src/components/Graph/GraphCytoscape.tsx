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
} from '../../model/graph/graph_cytoscape';
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
  onGraphReady
}) => {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [elements, setElements] = useState<any[]>([]);

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

    // 提供Cytoscape实例给外部使用
    if (onGraphReady) onGraphReady(cy);
  };

  // 当组件获取到Cytoscape实例时
  const getCyRef = (cy: any) => {
    cyRef.current = cy;
    registerEventHandlers(cy);

    // 应用布局
    const layout = cy.layout(createLayoutConfig(layoutName));
    layout.run();
  };

  // 组件样式
  const containerStyle: React.CSSProperties = {
    width: width,
    height: height,
    ...style
  };

  return (
    <div className={styles.graphContainer} style={containerStyle}>
      {elements.length > 0 && (
        <CytoscapeComponent
          key={elements.length}
          elements={elements as any}
          className={styles.graphContent}
          cy={(cy) => getCyRef(cy)}
          stylesheet={createBaseStyles() as any}
          userZoomingEnabled={true}
          userPanningEnabled={true}
          boxSelectionEnabled={true}
        />
      )}
    </div>
  );
};

export default GraphCytoscape;