import React from 'react';
import { Typography, Divider, Card } from 'antd';
import { nodeTypeConfig } from '../models/nodeTypes';
import * as Icons from '@ant-design/icons';

import styles from '../index.module.less';

const WorkflowSidebar: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // 动态获取图标组件
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[`${iconName}Outlined`];
    return IconComponent ? <IconComponent /> : null;
  };

  return (
    <div className={styles.workflowSidebar}>
      <Card
        title="节点类型"
        size="small"
        bordered={false}
        headStyle={{ padding: '0 0 8px 0' }}
        bodyStyle={{ padding: '0' }}
      >
        <div className={styles.nodeItemContainer}>
          {nodeTypeConfig.map((nodeType) => (
            <div
              key={nodeType.type}
              className={styles.nodeItem}
              onDragStart={(event) => onDragStart(event, nodeType.type)}
              draggable
              style={{ borderLeftColor: nodeType.color, borderLeftWidth: 4 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {getIcon(nodeType.icon)}
                <span>{nodeType.label}</span>
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                {nodeType.description}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Divider style={{ margin: '16px 0 12px' }} />

      <Card
        title="使用说明"
        size="small"
        bordered={false}
        headStyle={{ padding: '0 0 8px 0' }}
        bodyStyle={{ padding: '0' }}
      >
        <div style={{ fontSize: 12, color: '#666' }}>
          <p>1. 拖拽左侧节点到画布创建节点</p>
          <p>2. 连接节点创建工作流</p>
          <p>3. 点击节点可编辑属性</p>
          <p>4. 使用顶部工具栏保存或导出</p>
        </div>
      </Card>
    </div>
  );
};

export default WorkflowSidebar;