import React, { useState, useCallback } from 'react';
import { Card, Space, Typography, Collapse } from 'antd';
import GraphCytoscape from '@/components/Graph/GraphCytoscape';
import EnhancedGraphCytoscape from '@/components/Graph/EnhancedGraphCytoscape';
import NodeOperations from '@/components/Graph/NodeOperations';
import { GraphData, GraphNode, GraphEdge } from '@/model/graph/tool';
import styles from './index.module.less';
import { langGraphData, sampleData } from '@/model/graph/data';
import GraphLegend from './GraphLegend';
import GraphControls from './GraphControls';

const { Title, Paragraph } = Typography;
const { Panel } = Collapse;

const GraphPage: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>(sampleData);
  const [layoutName, setLayoutName] = useState<string>('cose');
  const [useEnhanced, setUseEnhanced] = useState<boolean>(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // 处理节点点击事件
  const handleNodeClick = (node: GraphNode) => {
    console.log('节点点击:', node);
    setSelectedNodeId(node.id);
  };

  // 处理边点击事件
  const handleEdgeClick = (edge: GraphEdge) => {
    console.log('边点击:', edge);
  };

  // 添加新节点
  const handleAddNode = useCallback((node: GraphNode) => {
    setGraphData(prev => ({
      nodes: [...prev.nodes, node],
      edges: [...prev.edges]
    }));
  }, []);

  // 添加新边
  const handleAddEdge = useCallback((source: string, target: string, weight: number = 1) => {
    setGraphData(prev => ({
      nodes: [...prev.nodes],
      edges: [...prev.edges, { source, target, weight }]
    }));
  }, []);

  // 处理添加出度节点
  const handleAddOutgoingEdge = useCallback((nodeId: string) => {
    // 生成随机ID
    const newNodeId = `node_${Math.floor(Math.random() * 1000)}`;

    // 添加新节点
    const newNode: GraphNode = {
      id: newNodeId,
      label: `${nodeId}的出度节点`
    };

    // 添加新节点和边
    setGraphData(prev => ({
      nodes: [...prev.nodes, newNode],
      edges: [...prev.edges, { source: nodeId, target: newNodeId, weight: 1 }]
    }));
  }, []);

  // 处理添加入度节点
  const handleAddIncomingEdge = useCallback((nodeId: string) => {
    // 生成随机ID
    const newNodeId = `node_${Math.floor(Math.random() * 1000)}`;

    // 添加新节点
    const newNode: GraphNode = {
      id: newNodeId,
      label: `${nodeId}的入度节点`
    };

    // 添加新节点和边
    setGraphData(prev => ({
      nodes: [...prev.nodes, newNode],
      edges: [...prev.edges, { source: newNodeId, target: nodeId, weight: 1 }]
    }));
  }, []);

  // 切换数据集
  const handleDatasetChange = useCallback((value: string) => {
    setGraphData(value === 'sample' ? sampleData : langGraphData);
  }, []);

  return (
    <div className={styles.graphPageContainer}>
      <div className={styles.titleSection}>
        <Title level={2}>Cytoscape.js + React 图可视化演示</Title>
        <Paragraph>
          基于Cytoscape.js和React 18构建的高性能图数据可视化组件，支持邻接表数据结构和LangGraph框架集成。
        </Paragraph>
      </div>

      <div className={styles.cardContainer}>
        <Collapse
          defaultActiveKey={['controls']}
          className={styles.configCollapse}
        >
          <Panel header="配置选项" key="controls" className={styles.configPanel}>
            <div className={styles.cardContent}>
              <GraphControls
                selectedData={graphData === sampleData ? 'sample' : 'langgraph'}
                layoutName={layoutName}
                useEnhanced={useEnhanced}
                onDatasetChange={handleDatasetChange}
                onLayoutChange={setLayoutName}
                onVersionChange={setUseEnhanced}
              />

              <NodeOperations
                graphData={graphData}
                onAddNode={handleAddNode}
                onAddEdge={handleAddEdge}
              />
            </div>
          </Panel>
        </Collapse>

        <Card
          title="图可视化"
          className={`${styles.card} ${styles.graphCard}`}
          bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px' }}
        >
          <div className={styles.graphContainer}>
            {useEnhanced ? (
              <EnhancedGraphCytoscape
                data={graphData}
                layoutName={layoutName}
                height="100%"
                width="100%"
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                onAddOutgoingEdge={handleAddOutgoingEdge}
                onAddIncomingEdge={handleAddIncomingEdge}
              />
            ) : (
              <GraphCytoscape
                data={graphData}
                layoutName={layoutName}
                height="100%"
                width="100%"
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
              />
            )}
          </div>
        </Card>

        <Collapse
          defaultActiveKey={['legend']}
          className={styles.legendCollapse}
        >
          <Panel header="节点状态说明" key="legend">
            <GraphLegend />
          </Panel>
        </Collapse>
      </div>
    </div>
  );
};

export default React.memo(GraphPage);