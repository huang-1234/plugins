import React from 'react';
import { Typography, Card } from 'antd';
import styles from './index.module.less';
import UnionFindVisualizer from '@/algorithm/UnionFind/GraphUnionFind';

const { Title } = Typography;

const UnionFindPage = () => {
  return (
    <div className={styles.unionFindPage}>
      <Title level={2}>并查集算法可视化</Title>
      <Card>
        <UnionFindVisualizer />
      </Card>
    </div>
  );
};

export default React.memo(UnionFindPage);