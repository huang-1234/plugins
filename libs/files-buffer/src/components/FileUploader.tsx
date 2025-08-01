import React, { useRef, useState, useCallback } from 'react';
import { FileChunker } from '../fileChunker';
import { UploadStatus } from '../types';
import type { ProgressInfo, UploadController, UploadResult } from '../types';
import './FileUploader.css';

export interface FileUploaderProps {
  /** 上传服务基础 URL */
  baseUrl: string;
  /** 分片大小（字节），默认 5MB */
  chunkSize?: number;
  /** 并发上传数量，默认 3 */
  concurrentLimit?: number;
  /** 上传按钮文本 */
  buttonText?: string;
  /** 上传中按钮文本 */
  uploadingText?: string;
  /** 是否显示哈希计算进度 */
  showHashProgress?: boolean;
  /** 上传成功回调 */
  onSuccess?: (result: UploadResult) => void;
  /** 上传失败回调 */
  onError?: (error: Error) => void;
  /** 上传进度回调 */
  onProgress?: (info: ProgressInfo) => void;
  /** 自定义样式 */
  className?: string;
  /** 按钮样式 */
  buttonClassName?: string;
  /** 进度条样式 */
  progressClassName?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 接受的文件类型 */
  accept?: string;
  /** 最大文件大小（字节） */
  maxSize?: number;
}

/**
 * 文件上传组件
 */
export const FileUploader: React.FC<FileUploaderProps> = ({
  baseUrl,
  chunkSize,
  concurrentLimit,
  buttonText = '选择文件',
  uploadingText = '上传中...',
  showHashProgress = true,
  onSuccess,
  onError,
  onProgress,
  className = '',
  buttonClassName = '',
  progressClassName = '',
  disabled = false,
  accept,
  maxSize
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [hashProgress, setHashProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [controller, setController] = useState<UploadController | null>(null);

  // 处理文件选择
  const handleFileChange = useCallback(async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    const file = fileInputRef.current.files[0];

    // 检查文件大小
    if (maxSize && file.size > maxSize) {
      setErrorMessage(`文件大小超过限制 (${(maxSize / 1024 / 1024).toFixed(2)}MB)`);
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadProgress(0);
    setHashProgress(0);
    setIsHashing(true);
    setUploadStatus(null);

    // 创建上传器
    const chunker = new FileChunker({
      baseUrl,
      chunkSize,
      concurrentLimit,
      useWorker: true
    });

    // 开始上传
    const { controller: uploadController, promise } = chunker.upload(
      file,
      (info) => {
        setUploadProgress(info.percent);
        onProgress?.(info);
      },
      (progress) => {
        setHashProgress(progress);
      }
    );

    // 保存控制器
    setController(uploadController);

    try {
      // 等待上传完成
      const result = await promise;
      setUploadStatus(result.status);

      if (result.status === UploadStatus.SUCCESS || result.status === UploadStatus.QUICK_SUCCESS) {
        onSuccess?.(result);
      } else if (result.error) {
        setErrorMessage(result.error.message);
        onError?.(result.error);
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
      onError?.(error as Error);
    } finally {
      setIsUploading(false);
      setIsHashing(false);
      // 重置文件输入，允许重新选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [baseUrl, chunkSize, concurrentLimit, maxSize, onError, onProgress, onSuccess]);

  // 处理暂停/恢复
  const handlePauseResume = useCallback(() => {
    if (!controller) return;

    if (controller.status === UploadStatus.PAUSED) {
      controller.resume();
    } else {
      controller.pause();
    }
  }, [controller]);

  // 处理取消
  const handleCancel = useCallback(() => {
    if (!controller) return;
    controller.cancel();
    setIsUploading(false);
    setIsHashing(false);
    setUploadProgress(0);
    setHashProgress(0);
  }, [controller]);

    return (
    <div className={`file-uploader ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isUploading || disabled}
        className="file-uploader-input"
        accept={accept}
        aria-label="文件选择"
        title="选择要上传的文件"
      />

      <div className="file-uploader-buttons">
        <button
          className={`file-uploader-button ${buttonClassName}`}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled}
        >
          {isUploading ? uploadingText : buttonText}
        </button>

        {isUploading && (
          <>
            <button
              className="file-uploader-control-button"
              onClick={handlePauseResume}
            >
              {controller?.status === UploadStatus.PAUSED ? '恢复' : '暂停'}
            </button>
            <button
              className="file-uploader-control-button"
              onClick={handleCancel}
            >
              取消
            </button>
          </>
        )}
      </div>

      {/* 哈希计算进度 */}
      {isHashing && showHashProgress && (
        <div className="file-uploader-progress">
          <p className="file-uploader-progress-text">计算文件指纹: {hashProgress}%</p>
          <progress
            value={hashProgress}
            max="100"
            className={`file-uploader-progress-bar ${progressClassName}`}
          />
        </div>
      )}

      {/* 上传进度 */}
      {(isUploading || uploadProgress > 0) && (
        <div className="file-uploader-progress">
          <p className="file-uploader-progress-text">上传进度: {uploadProgress}%</p>
          <progress
            value={uploadProgress}
            max="100"
            className={`file-uploader-progress-bar ${progressClassName}`}
          />
        </div>
      )}

      {/* 状态显示 */}
      {uploadStatus === UploadStatus.SUCCESS && (
        <p className="file-uploader-success">上传成功！</p>
      )}
      {uploadStatus === UploadStatus.QUICK_SUCCESS && (
        <p className="file-uploader-success">秒传成功！</p>
      )}
      {errorMessage && (
        <p className="file-uploader-error">错误: {errorMessage}</p>
      )}
    </div>
  );
};