import React from 'react';
import { Radio, Space } from 'antd';
import styles from './index.module.less';

interface GraphControlsProps {
  selectedData: string;
  layoutName: string;
  useEnhanced: boolean;
  onDatasetChange: (value: string) => void;
  onLayoutChange: (value: string) => void;
  onVersionChange: (value: boolean) => void;
}

const GraphControls: React.FC<GraphControlsProps> = ({
  selectedData,
  layoutName,
  useEnhanced,
  onDatasetChange,
  onLayoutChange,
  onVersionChange
}) => {
  return (
    <Space direction="vertical">
      <div className={styles.controlItem}>
        <span className={styles.controlLabel}>数据集:</span>
        <Radio.Group
          value={selectedData}
          onChange={(e) => onDatasetChange(e.target.value)}
        >
          <Radio.Button value="sample">简单流程图</Radio.Button>
          <Radio.Button value="langgraph">LangGraph示例</Radio.Button>
        </Radio.Group>
      </div>

      <div className={styles.controlItem}>
        <span className={styles.controlLabel}>布局算法:</span>
        <Radio.Group
          value={layoutName}
          onChange={(e) => onLayoutChange(e.target.value)}
        >
          <Radio.Button value="cose">力导向布局</Radio.Button>
          <Radio.Button value="circle">圆形布局</Radio.Button>
          <Radio.Button value="grid">网格布局</Radio.Button>
          <Radio.Button value="breadthfirst">树形布局</Radio.Button>
        </Radio.Group>
      </div>

      <div className={styles.controlItem}>
        <span className={styles.controlLabel}>组件版本:</span>
        <Radio.Group
          value={useEnhanced}
          onChange={(e) => onVersionChange(e.target.value)}
        >
          <Radio.Button value={false}>基础版</Radio.Button>
          <Radio.Button value={true}>增强版(支持右键菜单)</Radio.Button>
        </Radio.Group>
      </div>
    </Space>
  );
};

export default GraphControls;