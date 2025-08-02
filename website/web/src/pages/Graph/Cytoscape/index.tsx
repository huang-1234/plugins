import React, { useState } from 'react';
import { Card, Radio, Space, Typography, Button } from 'antd';
import GraphCytoscape from '../../../components/Graph/GraphCytoscape';
import EnhancedGraphCytoscape from '../../../modules/graph/GraphCytoscape';
import { GraphData } from '../../../model/graph/tool';
import styles from './index.module.less';
import { langGraphData, sampleData } from '@/model/graph/data';

const { Title, Paragraph } = Typography;

const GraphPage: React.FC = () => {
  const [selectedData, setSelectedData] = useState<GraphData>(sampleData);
  const [layoutName, setLayoutName] = useState<string>('cose');
  const [useEnhanced, setUseEnhanced] = useState<boolean>(false);

  // 处理节点点击事件
  const handleNodeClick = (node: any) => {
    console.log('节点点击:', node);
  };

  // 处理边点击事件
  const handleEdgeClick = (edge: any) => {
    console.log('边点击:', edge);
  };

  // 随机添加新节点（用于测试动态更新）
  const addRandomNode = () => {
    const newNodeId = `node_${Math.floor(Math.random() * 1000)}`;
    const randomStatus = ['running', 'success', 'failed', undefined][Math.floor(Math.random() * 4)];
    const randomTarget = selectedData.nodes[Math.floor(Math.random() * selectedData.nodes.length)].id;

    setSelectedData(prev => ({
      nodes: [...prev.nodes, { id: newNodeId, label: `随机节点 ${newNodeId}`, status: randomStatus as any }],
      edges: [...prev.edges, { source: randomTarget, target: newNodeId, weight: Math.random() }]
    }));
  };

  return (
    <div className={styles.graphPageContainer}>
      <div className={styles.titleSection}>
        <Title level={2}>Cytoscape.js + React 图可视化演示</Title>
        <Paragraph>
          基于Cytoscape.js和React 18构建的高性能图数据可视化组件，支持邻接表数据结构和LangGraph框架集成。
        </Paragraph>
      </div>

      <div className={styles.cardContainer}>
        <Card
          title="配置选项"
          size="small"
          className={`${styles.card} ${styles.controlsCard}`}
          bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <div className={styles.cardContent}>
            <Space direction="vertical">
              <div className={styles.controlItem}>
                <span className={styles.controlLabel}>数据集:</span>
                <Radio.Group
                  value={selectedData === sampleData ? 'sample' : 'langgraph'}
                  onChange={(e) => setSelectedData(e.target.value === 'sample' ? sampleData : langGraphData)}
                >
                  <Radio.Button value="sample">简单流程图</Radio.Button>
                  <Radio.Button value="langgraph">LangGraph示例</Radio.Button>
                </Radio.Group>
              </div>

              <div className={styles.controlItem}>
                <span className={styles.controlLabel}>布局算法:</span>
                <Radio.Group value={layoutName} onChange={(e) => setLayoutName(e.target.value)}>
                  <Radio.Button value="cose">力导向布局</Radio.Button>
                  <Radio.Button value="circle">圆形布局</Radio.Button>
                  <Radio.Button value="grid">网格布局</Radio.Button>
                  <Radio.Button value="breadthfirst">树形布局</Radio.Button>
                </Radio.Group>
              </div>

              <div className={styles.controlItem}>
                <span className={styles.controlLabel}>组件版本:</span>
                <Radio.Group value={useEnhanced} onChange={(e) => setUseEnhanced(e.target.value)}>
                  <Radio.Button value={false}>基础版</Radio.Button>
                  <Radio.Button value={true}>增强版</Radio.Button>
                </Radio.Group>
              </div>

              <Button
                type="primary"
                onClick={addRandomNode}
                className={styles.addNodeButton}
              >
                添加随机节点
              </Button>
            </Space>
          </div>
        </Card>

        <Card
          title="图可视化"
          className={`${styles.card} ${styles.graphCard}`}
          bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px' }}
        >
          <div className={styles.graphContainer}>
            {useEnhanced ? (
              <EnhancedGraphCytoscape
                data={selectedData}
                layoutName={layoutName}
                height="100%"
                width="100%"
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                enableNodeDragging={true}
                enableZoomControls={true}
                enableExport={true}
              />
            ) : (
              <GraphCytoscape
                data={selectedData}
                layoutName={layoutName}
                height="100%"
                width="100%"
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
              />
            )}
          </div>
        </Card>

        <Card
          title="节点状态说明"
          className={`${styles.card} ${styles.legendCard}`}
          bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <div className={styles.legendContainer}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.defaultColor}`} />
              <span>默认状态</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.runningColor}`} />
              <span>运行中 (running)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.successColor}`} />
              <span>成功 (success)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.failedColor}`} />
              <span>失败 (failed)</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default React.memo(GraphPage);