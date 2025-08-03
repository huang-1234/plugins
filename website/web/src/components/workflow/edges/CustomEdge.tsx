import React, { memo } from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

import styles from './edges.module.less';

const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isRejected = data?.isRejected;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isRejected ? '#ff4d4f' : style.stroke,
          strokeDasharray: isRejected ? '5 5' : style.strokeDasharray,
        }}
        className={isRejected ? styles.rejectedEdge : ''}
      />
      {data && (
        <text
          x={labelX}
          y={labelY}
          className={styles.edgeText}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fill: isRejected ? '#ff4d4f' : '#666' }}
        >
          {isRejected ? '拒绝' : ''}
        </text>
      )}
    </>
  );
};

export default memo(CustomEdge);