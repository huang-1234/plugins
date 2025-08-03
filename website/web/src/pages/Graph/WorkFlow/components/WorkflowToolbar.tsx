import React, { useCallback } from 'react';
import { Button, Space, Tooltip, Divider } from 'antd';
import {
  SaveOutlined,
  DownloadOutlined,
  UploadOutlined,
  UndoOutlined,
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  PlusOutlined,
  DeleteOutlined,
  LayoutOutlined
} from '@ant-design/icons';
import { useReactFlow } from '@xyflow/react';
import { downloadWorkflow } from '@/components/workflow';

import styles from '../index.module.less';

interface WorkflowToolbarProps {
  onDeleteSelected?: () => void;
  onAddNode?: () => void;
  onAutoLayout?: () => void;
}

const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  onDeleteSelected,
  onAddNode,
  onAutoLayout
}) => {
  const { zoomIn, zoomOut, fitView, getNodes, getEdges } = useReactFlow();

  const handleSave = () => {
    // 保存工作流逻辑
    console.log('Saving workflow...');
  };

  const handleDownload = () => {
    downloadWorkflow('my-workflow.json');
  };

  const handleUpload = () => {
    // 触发文件选择
    document.getElementById('workflow-upload')?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 处理文件上传逻辑
      console.log('Uploading file:', file.name);
    }
  };

  // 处理删除选中节点
  const handleDeleteSelected = useCallback(() => {
    const selectedNodes = getNodes().filter(node => node.selected);
    const selectedEdges = getEdges().filter(edge => edge.selected);

    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      console.log('Deleting selected elements:', { selectedNodes, selectedEdges });

      if (onDeleteSelected) {
        onDeleteSelected();
      }
    } else {
      console.log('No elements selected to delete');
    }
  }, [getNodes, getEdges, onDeleteSelected]);

  // 处理添加节点
  const handleAddNode = useCallback(() => {
    if (onAddNode) {
      onAddNode();
    }
  }, [onAddNode]);

  // 处理自动布局
  const handleAutoLayout = useCallback(() => {
    console.log('Auto layout...');
    if (onAutoLayout) {
      onAutoLayout();
    }
  }, [onAutoLayout]);

  return (
    <div className={styles.workflowToolbar}>
      <Space size="small">
        <Tooltip title="保存">
          <Button type="text" icon={<SaveOutlined />} onClick={handleSave} />
        </Tooltip>
        <Tooltip title="下载">
          <Button type="text" icon={<DownloadOutlined />} onClick={handleDownload} />
        </Tooltip>
        <Tooltip title="上传">
          <Button type="text" icon={<UploadOutlined />} onClick={handleUpload} />
          <input
            id="workflow-upload"
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </Tooltip>
      </Space>

      <Divider type="vertical" style={{ height: '20px', margin: '0 8px' }} />

      <Space size="small">
        <Tooltip title="撤销">
          <Button type="text" icon={<UndoOutlined />} disabled />
        </Tooltip>
        <Tooltip title="重做">
          <Button type="text" icon={<RedoOutlined />} disabled />
        </Tooltip>
      </Space>

      <Divider type="vertical" style={{ height: '20px', margin: '0 8px' }} />

      <Space size="small">
        <Tooltip title="添加节点">
          <Button type="text" icon={<PlusOutlined />} onClick={handleAddNode} />
        </Tooltip>
        <Tooltip title="删除选中">
          <Button type="text" icon={<DeleteOutlined />} onClick={handleDeleteSelected} />
        </Tooltip>
        <Tooltip title="自动布局">
          <Button type="text" icon={<LayoutOutlined />} onClick={handleAutoLayout} />
        </Tooltip>
      </Space>

      <div style={{ flex: 1 }} />

      <Space size="small">
        <Tooltip title="放大">
          <Button type="text" icon={<ZoomInOutlined />} onClick={() => zoomIn({ duration: 300 })} />
        </Tooltip>
        <Tooltip title="缩小">
          <Button type="text" icon={<ZoomOutOutlined />} onClick={() => zoomOut({ duration: 300 })} />
        </Tooltip>
        <Tooltip title="适应视图">
          <Button type="text" icon={<FullscreenOutlined />} onClick={() => fitView({ duration: 500 })} />
        </Tooltip>
      </Space>
    </div>
  );
};

export default React.memo(WorkflowToolbar);