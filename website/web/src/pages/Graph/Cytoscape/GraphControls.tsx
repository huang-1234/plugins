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

const GraphControls: React.FC<GraphControlsProps> = (props) => {
  const { selectedData, layoutName, useEnhanced, onDatasetChange, onLayoutChange, onVersionChange } = props || {};
  return (
    <Space direction="vertical">
      <div className={styles.controlItem}>
        <span className={styles.controlLabel}>数据集:</span>
        <Radio.Group
          value={selectedData}
          onChange={(e) => onDatasetChange(e.target.value)}
          options={[
            { label: '简单流程图', value: 'sample' },
            { label: 'LangGraph示例', value: 'langgraph' }
          ]}
        >
        </Radio.Group>
      </div>

      <div className={styles.controlItem}>
        <span className={styles.controlLabel}>布局算法:</span>
        <Radio.Group
          value={layoutName}
          onChange={(e) => onLayoutChange(e.target.value)}
          options={[
            { label: '力导向布局', value: 'cose' },
            { label: '圆形布局', value: 'circle' },
            { label: '网格布局', value: 'grid' },
            { label: '树形布局', value: 'breadthfirst' }
          ]}
        >
        </Radio.Group>
      </div>

      <div className={styles.controlItem}>
        <span className={styles.controlLabel}>组件版本:</span>
        <Radio.Group
          value={useEnhanced}
          onChange={(e) => onVersionChange(e.target.value)}
          options={[
            { label: '基础版', value: false },
            { label: '增强版(支持右键菜单)', value: true }
          ]}
        >
        </Radio.Group>
      </div>
    </Space>
  );
};

export default React.memo(GraphControls);