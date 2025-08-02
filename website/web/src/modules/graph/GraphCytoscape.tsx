import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GraphCytoscapeProps } from '../../components/Graph/GraphCytoscape';
import GraphCytoscape from '../../components/Graph/GraphCytoscape';
import { GraphData, GraphNode, GraphEdge } from '../../model/graph/graph_cytoscape';
import cytoscape from 'cytoscape';
import styles from './GraphCytoscape.module.less';

export interface EnhancedGraphCytoscapeProps extends GraphCytoscapeProps {
  // 实时数据更新配置
  liveUpdate?: boolean;
  updateInterval?: number;
  dataSource?: () => Promise<GraphData>;

  // 高级交互功能
  enableNodeDragging?: boolean;
  enableZoomControls?: boolean;
  enableFullscreen?: boolean;
  enableExport?: boolean;

  // 高级渲染选项
  useWebGL?: boolean;
  maxVisibleNodes?: number;

  // 事件回调
  onGraphChange?: (data: GraphData) => void;
  onLayoutComplete?: () => void;
}

/**
 * 增强版GraphCytoscape组件，提供更多高级功能
 * 包括实时数据更新、高级交互控制和性能优化
 */
const EnhancedGraphCytoscape: React.FC<EnhancedGraphCytoscapeProps> = ({
  data,
  liveUpdate = false,
  updateInterval = 5000,
  dataSource,
  enableNodeDragging = true,
  enableZoomControls = true,
  enableFullscreen = false,
  enableExport = false,
  useWebGL = false,
  maxVisibleNodes,
  onGraphChange,
  onLayoutComplete,
  onGraphReady,
  ...restProps
}) => {
  const [graphData, setGraphData] = useState<GraphData>(data);
  const [cyInstance, setCyInstance] = useState<cytoscape.Core | null>(null);

  // 处理实时数据更新
  useEffect(() => {
    if (!liveUpdate || !dataSource) return;

    const fetchData = async () => {
      try {
        const newData = await dataSource();
        setGraphData(newData);
        if (onGraphChange) onGraphChange(newData);
      } catch (error) {
        console.error('Failed to fetch graph data:', error);
      }
    };

    // 初始加载
    fetchData();

    // 定时更新
    const intervalId = setInterval(fetchData, updateInterval);
    return () => clearInterval(intervalId);
  }, [liveUpdate, dataSource, updateInterval, onGraphChange]);

  // 当外部数据变化时更新
  useEffect(() => {
    setGraphData(data);
  }, [data]);

  // 处理Cytoscape实例就绪
  const handleGraphReady = useCallback((cy: cytoscape.Core) => {
    setCyInstance(cy);

    // 配置节点拖动
    if (enableNodeDragging) {
      cy.nodes().grabify();
    } else {
      cy.nodes().ungrabify();
    }

    // 注册布局完成事件
    cy.on('layoutstop', () => {
      if (onLayoutComplete) onLayoutComplete();
    });

    // 调用原始的onGraphReady回调
    if (onGraphReady) onGraphReady(cy);
  }, [enableNodeDragging, onLayoutComplete, onGraphReady]);

  // 高亮相关节点和边的功能
  const highlightConnectedElements = useCallback((nodeId: string) => {
    if (!cyInstance) return;

    // 重置所有元素样式
    cyInstance.elements().removeClass('highlighted');
    cyInstance.elements().removeClass('faded');

    // 如果没有指定节点，则返回
    if (!nodeId) return;

    // 获取目标节点及其连接的边和节点
    const targetNode = cyInstance.getElementById(nodeId);
    const connectedEdges = targetNode.connectedEdges();
    const connectedNodes = targetNode.neighborhood('node');

    // 添加高亮样式
    targetNode.addClass('highlighted');
    connectedEdges.addClass('highlighted');
    connectedNodes.addClass('highlighted');

    // 将其他元素设置为淡出
    cyInstance.elements()
      .difference(targetNode)
      .difference(connectedEdges)
      .difference(connectedNodes)
      .addClass('faded');
  }, [cyInstance]);

  // 处理节点点击，添加高亮功能
  const handleNodeClick = useCallback((node: GraphNode) => {
    highlightConnectedElements(node.id);

    // 调用原始的onNodeClick回调
    if (restProps.onNodeClick) restProps.onNodeClick(node);
  }, [highlightConnectedElements, restProps.onNodeClick]);

  // 导出图为PNG图片
  const exportGraph = useCallback(() => {
    if (!cyInstance) return;

    const png = cyInstance.png({
      output: 'blob',
      bg: 'white',
      full: true
    });

    // 创建下载链接
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(png);
    downloadLink.download = 'graph-export.png';
    downloadLink.click();
  }, [cyInstance]);

  // 构建控制按钮
  const renderControls = useMemo(() => {
    if (!enableZoomControls && !enableFullscreen && !enableExport) return null;

    return (
      <div className={styles.controlsContainer}>
        {enableZoomControls && (
          <>
            <button
              onClick={() => cyInstance?.zoom(cyInstance.zoom() * 1.2)}
              className={styles.controlButton}
            >
              +
            </button>
            <button
              onClick={() => cyInstance?.zoom(cyInstance.zoom() / 1.2)}
              className={styles.controlButton}
            >
              -
            </button>
            <button
              onClick={() => cyInstance?.fit()}
              className={styles.controlButton}
            >
              适应
            </button>
          </>
        )}
        {enableExport && (
          <button
            onClick={exportGraph}
            className={styles.controlButton}
          >
            导出
          </button>
        )}
      </div>
    );
  }, [
    enableZoomControls,
    enableFullscreen,
    enableExport,
    cyInstance,
    exportGraph
  ]);

  return (
    <div className={styles.graphWrapper}>
      <GraphCytoscape
        {...restProps}
        data={graphData}
        onNodeClick={handleNodeClick}
        onGraphReady={handleGraphReady}
      />
      {renderControls}
    </div>
  );
};

export default EnhancedGraphCytoscape;