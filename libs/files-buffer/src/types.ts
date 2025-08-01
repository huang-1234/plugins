/**
 * 文件分片上传配置选项
 */
export interface FileChunkOptions {
  /** 分片大小（字节），默认 5MB */
  chunkSize?: number;
  /** 并发上传数量，默认 3 */
  concurrentLimit?: number;
  /** 上传基础URL */
  baseUrl: string;
  /** 上传重试次数，默认 3 */
  retryCount?: number;
  /** 上传超时时间（毫秒），默认 30000 */
  timeout?: number;
  /** 是否使用 Web Worker 计算哈希（如果浏览器支持），默认 true */
  useWorker?: boolean;
}

/**
 * 上传进度回调参数
 */
export interface ProgressInfo {
  /** 当前上传百分比（0-100） */
  percent: number;
  /** 已上传字节数 */
  loaded: number;
  /** 总字节数 */
  total: number;
  /** 当前上传的分片索引 */
  currentChunk?: number;
  /** 总分片数 */
  totalChunks?: number;
}

/**
 * 上传状态
 */
export enum UploadStatus {
  /** 准备中 */
  PENDING = 'pending',
  /** 计算哈希中 */
  HASHING = 'hashing',
  /** 上传中 */
  UPLOADING = 'uploading',
  /** 合并中 */
  MERGING = 'merging',
  /** 已完成 */
  SUCCESS = 'success',
  /** 已暂停 */
  PAUSED = 'paused',
  /** 失败 */
  ERROR = 'error',
  /** 秒传成功 */
  QUICK_SUCCESS = 'quick_success'
}

/**
 * 上传结果
 */
export interface UploadResult {
  /** 上传状态 */
  status: UploadStatus;
  /** 文件哈希值 */
  fileHash: string;
  /** 文件名 */
  fileName: string;
  /** 文件大小 */
  fileSize: number;
  /** 是否秒传 */
  isQuickUpload: boolean;
  /** 服务端返回数据 */
  response?: any;
  /** 错误信息 */
  error?: Error;
}

/**
 * 上传控制器
 */
export interface UploadController {
  /** 暂停上传 */
  pause: () => void;
  /** 恢复上传 */
  resume: () => void;
  /** 取消上传 */
  cancel: () => void;
  /** 当前上传状态 */
  status: UploadStatus;
}

/**
 * 服务端检查文件响应
 */
export interface CheckFileResponse {
  /** 文件是否已存在（秒传） */
  exists: boolean;
  /** 已上传的分片索引 */
  uploadedChunks?: number[];
}