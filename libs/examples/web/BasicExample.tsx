import React, { useState } from 'react';
import { FileUploader, UploadResult, UploadStatus } from '../../files-buffer/src/index';

/**
 * 基础使用示例
 */
export const BasicExample: React.FC = () => {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (result: UploadResult) => {
    setUploadResult(result);
    setError(null);
  };

  const handleError = (err: Error) => {
    setError(err.message);
    setUploadResult(null);
  };

  return (
    <div className="example-container">
      <h2>大文件分片上传示例</h2>

      <FileUploader
        baseUrl="/api"
        chunkSize={5 * 1024 * 1024} // 5MB
        concurrentLimit={3}
        buttonText="选择文件"
        uploadingText="上传中..."
        showHashProgress={true}
        onSuccess={handleSuccess}
        onError={handleError}
        accept="*/*"
        maxSize={1024 * 1024 * 1024} // 1GB
      />

      {uploadResult && (
        <div className="result-container">
          <h3>上传结果</h3>
          <p>状态: {uploadResult.status === UploadStatus.QUICK_SUCCESS ? '秒传成功' : '上传成功'}</p>
          <p>文件名: {uploadResult.fileName}</p>
          <p>文件大小: {(uploadResult.fileSize / 1024 / 1024).toFixed(2)} MB</p>
          <p>文件哈希: {uploadResult.fileHash}</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <h3>上传失败</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};