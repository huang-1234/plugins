import React, { useState, useCallback, useRef } from 'react';
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
  const [layoutChangeCounter, setLayoutChangeCounter] = useState<number>(0);
  const cyInstanceRef = useRef<any>(null);

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
  const onAddNode = useCallback((node: GraphNode) => {
    setGraphData(prev => ({
      nodes: [...prev.nodes, node],
      edges: [...prev.edges]
    }));
  }, []);

  // 添加新边
  const onAddEdge = useCallback((source: string, target: string, weight: number = 1) => {
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
  const onDatasetChange = useCallback((value: string) => {
    setGraphData(value === 'sample' ? sampleData : langGraphData);
    // 数据集变更时重置布局计数器，强制重新布局
    setLayoutChangeCounter(prev => prev + 1);
  }, []);

  // 切换布局算法
  const onLayoutChange = useCallback((value: string) => {
    setLayoutName(value);
    setLayoutChangeCounter(prev => prev + 1); // 触发布局重新应用

    // 如果有cytoscape实例，直接应用新布局
    if (cyInstanceRef.current) {
      const cy = cyInstanceRef.current;
      // 解锁所有节点以便重新布局
      cy.nodes().unlock();

      // 应用新布局
      const layout = cy.layout({
        name: value,
        fit: true,
        padding: 50
      });
      layout.run();
    }
  }, []);

  // 保存Cytoscape实例引用
  const handleGraphReady = useCallback((cy: any) => {
    cyInstanceRef.current = cy;
  }, []);

  return (
    <div className={styles.graphPageContainer}>
      <div className={styles.titleSection}>
        <Title level={2}>Cytoscape.js + React 图可视化演示</Title>
        <Paragraph style={{ marginBottom: 0 }}>
          基于Cytoscape.js和React 18构建的高性能图数据可视化组件，支持邻接表数据结构和LangGraph框架集成。
        </Paragraph>
      </div>

      <div className={styles.cardContainer}>
        <Collapse
          defaultActiveKey={['controls']}
          className={styles.configCollapse}
        >
          <Panel header="节点状态说明" key="legend">
            <GraphLegend />
          </Panel>
          <Panel header="配置选项" key="controls" className={styles.configPanel}>
            <div className={styles.cardContent}>
              <GraphControls
                selectedData={graphData === sampleData ? 'sample' : 'langgraph'}
                layoutName={layoutName}
                useEnhanced={useEnhanced}
                onDatasetChange={onDatasetChange}
                onLayoutChange={onLayoutChange}
                onVersionChange={setUseEnhanced}
              />

              <NodeOperations
                graphData={graphData}
                onAddNode={onAddNode}
                onAddEdge={onAddEdge}
              />
            </div>
          </Panel>
        </Collapse>

        <Card
          title="图可视化"
          className={`${styles.card} ${styles.graphCard}`}
          styles={{
            body: {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '12px'
            }
          }}
        >
          <div className={styles.graphContainer}>
            {useEnhanced ? (
              <EnhancedGraphCytoscape
                key={`enhanced-graph-${layoutChangeCounter}`}
                data={graphData}
                layoutName={layoutName}
                height="100%"
                width="100%"
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                onAddOutgoingEdge={handleAddOutgoingEdge}
                onAddIncomingEdge={handleAddIncomingEdge}
                onGraphReady={handleGraphReady}
              />
            ) : (
              <GraphCytoscape
                key={`basic-graph-${layoutChangeCounter}`}
                data={graphData}
                layoutName={layoutName}
                height="100%"
                width="100%"
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                onGraphReady={handleGraphReady}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default React.memo(GraphPage);