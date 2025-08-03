import React from 'react';
import { Divider, Card } from 'antd';
import { nodeTypeConfig } from '../models/nodeTypes';
import * as Icons from '@ant-design/icons';

import styles from '../index.module.less';

const WorkflowSidebar: React.FC = () => {
  // 修复拖拽问题：确保拖拽事件正确设置数据
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    // 确保设置正确的数据格式
    event.dataTransfer.setData('application/reactflow', nodeType);
    // 设置拖拽效果
    event.dataTransfer.effectAllowed = 'move';

    // 添加视觉反馈
    const target = event.currentTarget as HTMLDivElement;
    target.style.opacity = '0.4';

    // 设置拖拽图像（可选）
    const dragImage = document.createElement('div');
    dragImage.textContent = nodeType;
    dragImage.style.backgroundColor = 'white';
    dragImage.style.padding = '8px';
    dragImage.style.border = '1px solid #ddd';
    dragImage.style.borderRadius = '4px';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);

    event.dataTransfer.setDragImage(dragImage, 0, 0);

    // 延迟移除拖拽图像
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  // 拖拽结束时恢复样式
  const onDragEnd = (event: React.DragEvent) => {
    const target = event.currentTarget as HTMLDivElement;
    target.style.opacity = '1';
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
              onDragEnd={onDragEnd}
              draggable={true} // 明确设置为可拖拽
              style={{
                borderLeftColor: nodeType.color,
                borderLeftWidth: 4,
                cursor: 'grab' // 添加拖拽光标样式
              }}
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
          <p>3. 右键点击节点可编辑属性</p>
          <p>4. 使用顶部工具栏保存或导出</p>
          <p>5. 可使用键盘快捷键：Delete删除、Ctrl+D复制</p>
        </div>
      </Card>
    </div>
  );
};

export default React.memo(WorkflowSidebar);