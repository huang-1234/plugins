import SparkMD5 from 'spark-md5';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { UploadStatus } from './types';
import type { FileChunkOptions, ProgressInfo, UploadController, UploadResult, CheckFileResponse } from './types';

// 默认配置
const DEFAULT_OPTIONS: Partial<FileChunkOptions> = {
  chunkSize: 5 * 1024 * 1024, // 5MB
  concurrentLimit: 3,
  retryCount: 3,
  timeout: 30000,
  useWorker: true
};

/**
 * 文件分片上传管理器
 */
export class FileChunker {
  private options: Required<FileChunkOptions>;
  private http: AxiosInstance;
  private abortController: AbortController;
  private isPaused: boolean = false;
  private currentStatus: UploadStatus = UploadStatus.PENDING;
  private uploadedChunks: Set<number> = new Set();

  /**
   * 创建文件分片上传管理器
   * @param options 上传配置
   */
  constructor(options: FileChunkOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options } as Required<FileChunkOptions>;
    this.abortController = new AbortController();

    // 创建 axios 实例
    this.http = axios.create({
      baseURL: this.options.baseUrl,
      timeout: this.options.timeout,
      signal: this.abortController.signal
    });
  }

  /**
   * 计算文件哈希
   * @param file 文件对象
   * @param progressCallback 哈希计算进度回调
   * @returns 文件哈希值
   */
  private async calculateHash(
    file: File,
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    // 使用 Web Worker 计算哈希（如果支持）
    if (this.options.useWorker && typeof Worker !== 'undefined') {
      return new Promise((resolve, reject) => {
        // 创建 Worker
        const worker = new Worker(
          new URL('./hash.worker.ts', import.meta.url),
          { type: 'module' }
        );

        worker.onmessage = (e) => {
          const { type, hash, progress, error } = e.data;

          if (type === 'progress' && progressCallback) {
            progressCallback(progress);
          } else if (type === 'complete') {
            resolve(hash);
            worker.terminate();
          } else if (type === 'error') {
            reject(new Error(error || 'Hash calculation failed'));
            worker.terminate();
          }
        };

        worker.onerror = (e) => {
          reject(e.error || new Error('Worker error'));
          worker.terminate();
        };

        // 发送文件到 Worker
        worker.postMessage({
          file,
          chunkSize: this.options.chunkSize
        });
      });
    }

    // 回退到主线程计算
    return new Promise((resolve) => {
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();
      const chunks = Math.ceil(file.size / this.options.chunkSize);
      let currentChunk = 0;

      fileReader.onload = (e) => {
        spark.append(e.target?.result as ArrayBuffer);
        currentChunk++;

        if (progressCallback) {
          progressCallback(Math.floor((currentChunk / chunks) * 100));
        }

        if (currentChunk < chunks) {
          loadNextChunk();
        } else {
          resolve(spark.end());
        }
      };

      const loadNextChunk = () => {
        const start = currentChunk * this.options.chunkSize;
        const end = Math.min(file.size, start + this.options.chunkSize);
        const chunk = file.slice(start, end);
        fileReader.readAsArrayBuffer(chunk);
      };

      loadNextChunk();
    });
  }

  /**
   * 将文件切割为分片
   * @param file 文件对象
   * @returns 分片数组
   */
  private splitFileToChunks(file: File): Blob[] {
    const chunks: Blob[] = [];
    let offset = 0;

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + this.options.chunkSize);
      chunks.push(chunk);
      offset += this.options.chunkSize;
    }

    return chunks;
  }

  /**
   * 检查文件是否已存在（用于秒传）
   * @param fileHash 文件哈希
   * @param fileName 文件名
   * @returns 检查结果
   */
  private async checkFileExists(fileHash: string, fileName: string): Promise<CheckFileResponse> {
    try {
      const { data } = await this.http.post('/check', {
        fileHash,
        fileName
      });
      return data;
    } catch (error) {
      console.error('检查文件失败:', error);

      // 如果是网络错误或超时，抛出错误以便上层处理
      if (axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || !error.response)) {
        throw new Error(`网络连接问题: ${error.message}`);
      }

      // 其他错误返回默认值
      return { exists: false, uploadedChunks: [] };
    }
  }

  /**
   * 上传单个分片
   * @param chunk 分片数据
   * @param index 分片索引
   * @param fileHash 文件哈希
   * @param fileName 文件名
   * @param retryCount 重试次数
   * @param onProgress 上传进度回调
   * @returns 上传结果
   */
  private async uploadChunk(
    chunk: Blob,
    index: number,
    fileHash: string,
    fileName: string,
    retryCount: number = 0,
    onProgress?: (info: ProgressInfo) => void
  ): Promise<boolean> {
    // 如果已暂停，则返回
    if (this.isPaused) {
      return false;
    }

    // 如果已上传，则跳过
    if (this.uploadedChunks.has(index)) {
      return true;
    }

    try {
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('index', index.toString());
      formData.append('fileHash', fileHash);
      formData.append('fileName', fileName);

      const config: AxiosRequestConfig = {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            onProgress({
              percent: Math.floor((progressEvent.loaded / progressEvent.total) * 100),
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              currentChunk: index
            });
          }
        }
      };

      await this.http.post('/upload', formData, config);
      this.uploadedChunks.add(index);
      return true;
    } catch (error) {
      // 重试逻辑
      if (retryCount < this.options.retryCount) {
        console.warn(`分片 ${index} 上传失败，正在重试 (${retryCount + 1}/${this.options.retryCount})...`);
        return this.uploadChunk(chunk, index, fileHash, fileName, retryCount + 1, onProgress);
      }

      console.error(`分片 ${index} 上传失败:`, error);
      throw error;
    }
  }

  /**
   * 请求服务器合并分片
   * @param fileHash 文件哈希
   * @param fileName 文件名
   * @param size 文件大小
   * @returns 合并结果
   */
  private async mergeChunks(fileHash: string, fileName: string, size: number): Promise<any> {
    try {
      const { data } = await this.http.post('/merge', {
        fileHash,
        fileName,
        size
      });
      return data;
    } catch (error) {
      console.error('合并文件失败:', error);
      throw error;
    }
  }

  /**
   * 保存上传进度到本地存储
   * @param fileHash 文件哈希
   */
  private saveProgress(fileHash: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          `file_upload_${fileHash}`,
          JSON.stringify(Array.from(this.uploadedChunks))
        );
      }
    } catch (error) {
      console.warn('保存上传进度失败:', error);
    }
  }

  /**
   * 从本地存储加载上传进度
   * @param fileHash 文件哈希
   */
  private loadProgress(fileHash: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedProgress = window.localStorage.getItem(`file_upload_${fileHash}`);
        if (savedProgress) {
          const chunks = JSON.parse(savedProgress) as number[];
          this.uploadedChunks = new Set(chunks);
        }
      }
    } catch (error) {
      console.warn('加载上传进度失败:', error);
    }
  }

  /**
   * 清除本地存储的上传进度
   * @param fileHash 文件哈希
   */
  private clearProgress(fileHash: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(`file_upload_${fileHash}`);
      }
    } catch (error) {
      console.warn('清除上传进度失败:', error);
    }
  }

  /**
   * 上传文件
   * @param file 文件对象
   * @param onProgress 上传进度回调
   * @param onHashProgress 哈希计算进度回调
   * @returns 上传控制器和上传结果 Promise
   */
  public upload(
    file: File,
    onProgress?: (info: ProgressInfo) => void,
    onHashProgress?: (progress: number) => void
  ): { controller: UploadController; promise: Promise<UploadResult> } {
    // 重置状态
    this.isPaused = false;
    this.uploadedChunks.clear();
    this.abortController = new AbortController();
    this.currentStatus = UploadStatus.PENDING;

    // 创建上传控制器
    const controller: UploadController = {
      pause: () => {
        this.isPaused = true;
        this.currentStatus = UploadStatus.PAUSED;
      },
      resume: () => {
        if (this.currentStatus === UploadStatus.PAUSED) {
          this.isPaused = false;
          this.currentStatus = UploadStatus.UPLOADING;
        }
      },
      cancel: () => {
        this.abortController.abort();
        this.currentStatus = UploadStatus.ERROR;
      },
      status: this.currentStatus
    };

    // 定义 status 属性的 getter，使其始终返回最新状态
    Object.defineProperty(controller, 'status', {
      get: () => this.currentStatus
    });

    // 上传过程
    const promise = (async (): Promise<UploadResult> => {
      try {
        // 1. 计算文件哈希
        this.currentStatus = UploadStatus.HASHING;
        const fileHash = await this.calculateHash(file, onHashProgress);

        // 2. 加载断点续传进度
        this.loadProgress(fileHash);

        // 3. 检查文件是否已存在（秒传）
        const { exists, uploadedChunks = [] } = await this.checkFileExists(fileHash, file.name);

        // 4. 如果文件已存在，直接返回成功
        if (exists) {
          this.currentStatus = UploadStatus.QUICK_SUCCESS;
          this.clearProgress(fileHash);
          return {
            status: UploadStatus.QUICK_SUCCESS,
            fileHash,
            fileName: file.name,
            fileSize: file.size,
            isQuickUpload: true
          };
        }

        // 5. 更新已上传的分片
        uploadedChunks.forEach(index => this.uploadedChunks.add(index));

        // 6. 分片上传
        this.currentStatus = UploadStatus.UPLOADING;
        const chunks = this.splitFileToChunks(file);
        const totalChunks = chunks.length;

        // 上传进度更新函数
        const updateTotalProgress = () => {
          if (onProgress) {
            const uploadedCount = this.uploadedChunks.size;
            onProgress({
              percent: Math.floor((uploadedCount / totalChunks) * 100),
              loaded: uploadedCount * this.options.chunkSize,
              total: file.size,
              currentChunk: uploadedCount,
              totalChunks
            });
          }
        };

        // 初始进度更新
        updateTotalProgress();

        // 并发上传
        for (let i = 0; i < totalChunks; i += this.options.concurrentLimit) {
          // 如果已暂停，等待恢复
          while (this.isPaused) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // 如果已取消，抛出错误
          if (this.abortController.signal.aborted) {
            throw new Error('上传已取消');
          }

          const uploadPromises = chunks
            .slice(i, i + this.options.concurrentLimit)
            .map((chunk, index) => {
              const chunkIndex = i + index;
              return this.uploadChunk(
                chunk,
                chunkIndex,
                fileHash,
                file.name,
                0,
                info => {
                  if (onProgress) {
                    // 计算总体进度
                    const uploadedCount = this.uploadedChunks.size;
                    const currentChunkProgress = info.percent / 100;
                    const totalPercent = (
                      ((uploadedCount + currentChunkProgress - 1) / totalChunks) * 100
                    );

                    onProgress({
                      percent: Math.floor(totalPercent),
                      loaded: uploadedCount * this.options.chunkSize + info.loaded,
                      total: file.size,
                      currentChunk: chunkIndex,
                      totalChunks
                    });
                  }
                }
              );
            });

          // 等待当前批次上传完成
          await Promise.all(uploadPromises);

          // 保存进度
          this.saveProgress(fileHash);

          // 更新总进度
          updateTotalProgress();
        }

        // 7. 合并分片
        this.currentStatus = UploadStatus.MERGING;
        const mergeResult = await this.mergeChunks(fileHash, file.name, file.size);

        // 8. 清除进度记录
        this.clearProgress(fileHash);

        // 9. 返回上传结果
        this.currentStatus = UploadStatus.SUCCESS;
        return {
          status: UploadStatus.SUCCESS,
          fileHash,
          fileName: file.name,
          fileSize: file.size,
          isQuickUpload: false,
          response: mergeResult
        };
      } catch (error) {
        // 上传失败
        this.currentStatus = UploadStatus.ERROR;
        return {
          status: UploadStatus.ERROR,
          fileHash: '',
          fileName: file.name,
          fileSize: file.size,
          isQuickUpload: false,
          error: error as Error
        };
      }
    })();

    return { controller, promise };
  }
}