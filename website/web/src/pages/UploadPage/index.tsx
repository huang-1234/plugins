import React, { useState } from 'react';
import { Card, Upload, Button, message, Progress } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import axios from 'axios';

const UploadPage = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const handleUpload = async () => {
    const file = fileList[0]?.originFileObj;
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      // 文件分片上传，每片10MB
      const chunkSize = 10 * 1024 * 1024;
      const chunks = Math.ceil(file.size / chunkSize);

      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('hash', file.name);
        formData.append('index', String(i));

        await axios.post('/api/upload', formData, {
          headers: { 'Content-Range': `bytes ${start}-${end}/${file.size}` },
          onUploadProgress: (progressEvent) => {
            const percentComplete = Math.round(
              ((i + progressEvent.loaded / (progressEvent?.total || 0)) / chunks) * 100
            );
            setProgress(percentComplete);
          }
        });
      }

      // 合并请求
      await axios.post('/api/upload/merge', {
        fileHash: file.name,
        fileName: file.name,
        size: file.size
      });

      message.success('上传成功');
    } catch (error) {
      console.error('上传失败:', error);
      message.error('上传失败');
    } finally {
      setUploading(false);
      setFileList([]);
    }
  };

  const uploadProps = {
    onRemove: (file: UploadFile) => {
      setFileList([]);
    },
    beforeUpload: (file: UploadFile) => {
      setFileList([file]);
      return false;
    },
    fileList,
  };

  return (
    <Card title="文件上传">
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />}>选择文件</Button>
      </Upload>

      {progress > 0 && <Progress percent={progress} />}

      <Button
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0}
        loading={uploading}
        style={{ marginTop: 16 }}
      >
        {uploading ? '上传中' : '开始上传'}
      </Button>
    </Card>
  );
};

export default UploadPage;