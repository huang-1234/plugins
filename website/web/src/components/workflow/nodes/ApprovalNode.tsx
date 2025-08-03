import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Badge } from 'antd';
import { BusinessNodeData } from '../types';

import styles from './nodes.module.less';

const statusMap = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error'
};

const ApprovalNode: React.FC<NodeProps<BusinessNodeData>> = ({ data, selected }) => {
  return (
    <div className={`${styles.approvalNode} ${selected ? styles.selected : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className={styles.nodeContent}>
        <Badge status={statusMap[data.status]} text={data.label} />
        <div className={styles.assignee}>审批人: {data.assignee || "自动分配"}</div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default memo(ApprovalNode);