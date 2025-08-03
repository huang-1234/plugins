import React from 'react';
import styles from './index.module.less';

const GraphLegend: React.FC = () => {
  return (
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
  );
};

export default React.memo(GraphLegend);