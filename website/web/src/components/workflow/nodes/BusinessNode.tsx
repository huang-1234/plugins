import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BusinessNodeData } from '../types';

import styles from './nodes.module.less';

const BusinessNode: React.FC<NodeProps<BusinessNodeData>> = ({ data, selected, type }) => {
  return (
    <div className={`${styles.businessNode} ${styles[type || '']} ${selected ? styles.selected : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className={styles.nodeContent}>
        <div className={styles.label}>{data.label}</div>
        <div className={styles.status}>{data.status}</div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default memo(BusinessNode);