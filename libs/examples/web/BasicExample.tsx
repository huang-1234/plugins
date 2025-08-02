import React, { useState, useEffect, useRef } from 'react';
import { FileUploader, UploadResult, UploadStatus, UploadController } from '../../files-buffer/src/index';

/**
 * 基础使用示例
 */
export const BasicExample: React.FC = () => {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>(navigator.onLine ? 'online' : 'offline');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const uploadControllerRef = useRef<UploadController | null>(null);

  // 监听网络状态变化
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online');
      // 如果正在上传且之前因为网络问题暂停，则自动恢复
      if (isUploading && isPaused && uploadControllerRef.current) {
        handleResumeUpload();
      }
    };

    const handleOffline = () => {
      setNetworkStatus('offline');
      // 如果正在上传，则自动暂停
      if (isUploading && !isPaused && uploadControllerRef.current) {
        handlePauseUpload();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isUploading, isPaused]);

  const handleSuccess = (result: UploadResult) => {
    setUploadResult(result);
    setError(null);
    setIsUploading(false);
    setIsPaused(false);
    uploadControllerRef.current = null;
  };

  const handleError = (err: Error) => {
    console.log('上传错误:', err.message);

    // 如果是因为暂停导致的错误，不显示错误信息
    if (err.message !== '上传已暂停' && err.message !== '请求已取消' && !err.message.includes('timeout')) {
      setError(err.message);
      setUploadResult(null);
      setIsUploading(false);
      uploadControllerRef.current = null;
    } else if (err.message.includes('timeout')) {
      // 超时自动暂停
      setIsPaused(true);
      setError('上传超时，已自动暂停。请点击"恢复上传"按钮继续。');
    } else if (err.message.includes('Cannot read properties of null') || err.message.includes('getAttribute')) {
      // DOM 引用错误，可能是由于组件卸载或元素不存在
      setError('上传过程中出现错误，请重试。');
      setIsUploading(false);
      uploadControllerRef.current = null;
    }
  };

  const handleProgress = (info: any) => {
    setUploadProgress(info.percent);
  };

  const handleUploadStart = (controller: UploadController) => {
    uploadControllerRef.current = controller;
    setIsUploading(true);
    setIsPaused(false);
    setError(null);
    setUploadResult(null);
  };

  const handlePauseUpload = () => {
    if (uploadControllerRef.current) {
      uploadControllerRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleResumeUpload = () => {
    if (uploadControllerRef.current) {
      uploadControllerRef.current.resume();
      setIsPaused(false);
      setError(null); // 清除可能的超时错误提示
    }
  };

  const handleCancelUpload = () => {
    if (uploadControllerRef.current) {
      uploadControllerRef.current.cancel();
      setIsUploading(false);
      setIsPaused(false);
      uploadControllerRef.current = null;
      setUploadProgress(0);
    }
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
        onProgress={handleProgress}
        onUploadStart={handleUploadStart}
        accept="*/*"
        maxSize={1024 * 1024 * 1024} // 1GB
        timeout={60000} // 增加超时时间到60秒
        retryCount={3} // 添加重试次数
      />

      {/* 上传控制按钮 */}
      {isUploading && (
        <div className="upload-controls">
          {!isPaused ? (
            <button
              className="pause-button"
              onClick={handlePauseUpload}
              disabled={!isUploading}
            >
              暂停上传
            </button>
          ) : (
            <button
              className="resume-button"
              onClick={handleResumeUpload}
              disabled={!isPaused}
            >
              恢复上传
            </button>
          )}
          <button
            className="cancel-button"
            onClick={handleCancelUpload}
            disabled={!isUploading}
          >
            取消上传
          </button>
        </div>
      )}

      {/* 网络状态指示器 */}
      <div className={`network-status ${networkStatus === 'offline' ? 'offline' : ''}`}>
        网络状态: {networkStatus === 'online' ? '正常' : '离线（上传已自动暂停）'}
      </div>

      {/* 上传进度 */}
      {isUploading && (
        <div className="upload-progress">
          <div className="progress-text">上传进度: {uploadProgress}%</div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}

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
          <h3>上传提示</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};