import React from 'react';
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

const WorkflowToolbar: React.FC = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

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

  const handleAutoLayout = () => {
    console.log('Auto layout...');
    // 这里可以实现自动布局逻辑
  };

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
          <Button type="text" icon={<PlusOutlined />} />
        </Tooltip>
        <Tooltip title="删除选中">
          <Button type="text" icon={<DeleteOutlined />} />
        </Tooltip>
        <Tooltip title="自动布局">
          <Button type="text" icon={<LayoutOutlined />} onClick={handleAutoLayout} />
        </Tooltip>
      </Space>

      <div style={{ flex: 1 }} />

      <Space size="small">
        <Tooltip title="放大">
          <Button type="text" icon={<ZoomInOutlined />} onClick={() => zoomIn()} />
        </Tooltip>
        <Tooltip title="缩小">
          <Button type="text" icon={<ZoomOutOutlined />} onClick={() => zoomOut()} />
        </Tooltip>
        <Tooltip title="适应视图">
          <Button type="text" icon={<FullscreenOutlined />} onClick={() => fitView()} />
        </Tooltip>
      </Space>
    </div>
  );
};

export default WorkflowToolbar;