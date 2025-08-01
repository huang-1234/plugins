import { describe, expect, test, vi, beforeEach } from 'vitest';
import { FileChunker, UploadStatus } from '../src';
import axios from 'axios';

// 模拟 axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// 模拟 FormData
global.FormData = class FormData {
  private data: Record<string, any> = {};
  append(key: string, value: any) {
    this.data[key] = value;
  }
  get(key: string) {
    return this.data[key];
  }
} as any;

// 模拟 Blob 和 File
global.Blob = class Blob {
  size: number;
  type: string;
  private content: string;

  constructor(parts: any[], options: any = {}) {
    this.content = parts.join('');
    this.size = this.content.length;
    this.type = options.type || '';
  }

  slice(start: number, end: number): Blob {
    const slicedContent = this.content.slice(start, end);
    return new Blob([slicedContent], { type: this.type });
  }
} as any;

global.File = class File extends Blob {
  name: string;
  lastModified: number;

  constructor(parts: any[], name: string, options: any = {}) {
    super(parts, options);
    this.name = name;
    this.lastModified = options.lastModified || Date.now();
  }
} as any;

// 测试 FileChunker
describe('FileChunker', () => {
  let fileChunker: FileChunker;
  let testFile: File;

  beforeEach(() => {
    // 创建测试文件
    testFile = new File(['test file content'], 'test.txt', { type: 'text/plain' });

    // 创建 FileChunker 实例
    fileChunker = new FileChunker({
      baseUrl: 'http://test-api.com',
      chunkSize: 5, // 使用小的分片大小便于测试
      concurrentLimit: 2,
      useWorker: false // 测试环境中禁用 Worker
    });

    // 重置 axios 模拟
    vi.resetAllMocks();

    // 模拟 axios.create 返回模拟的 axios 实例
    mockedAxios.create.mockReturnValue(mockedAxios as any);
  });

  test('应该正确初始化', () => {
    expect(fileChunker).toBeDefined();
  });

  test('应该检查文件是否存在', async () => {
    // 模拟 axios 响应
    mockedAxios.post.mockResolvedValueOnce({
      data: { exists: true }
    });

    // 使用私有方法测试
    const result = await (fileChunker as any).checkFileExists('hash123', 'test.txt');

    expect(result).toEqual({ exists: true });
    expect(mockedAxios.post).toHaveBeenCalledWith('/check', {
      fileHash: 'hash123',
      fileName: 'test.txt'
    });
  });

  test('应该处理秒传', async () => {
    // 模拟文件哈希计算
    vi.spyOn(fileChunker as any, 'calculateHash').mockResolvedValue('hash123');

    // 模拟文件检查响应 - 文件已存在
    mockedAxios.post.mockResolvedValueOnce({
      data: { exists: true }
    });

    // 上传文件
    const { promise } = fileChunker.upload(testFile);
    const result = await promise;

    // 验证结果
    expect(result.status).toBe(UploadStatus.QUICK_SUCCESS);
    expect(result.isQuickUpload).toBe(true);
    expect(result.fileHash).toBe('hash123');
    expect(result.fileName).toBe('test.txt');
  });

  test('应该处理正常上传', async () => {
    // 模拟文件哈希计算
    vi.spyOn(fileChunker as any, 'calculateHash').mockResolvedValue('hash123');

    // 模拟文件检查响应 - 文件不存在
    mockedAxios.post.mockResolvedValueOnce({
      data: { exists: false, uploadedChunks: [] }
    });

    // 模拟分片上传响应
    mockedAxios.post.mockResolvedValue({ data: { success: true } });

    // 模拟合并响应
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, url: '/files/hash123' }
    });

    // 上传文件
    const { promise } = fileChunker.upload(testFile);
    const result = await promise;

    // 验证结果
    expect(result.status).toBe(UploadStatus.SUCCESS);
    expect(result.isQuickUpload).toBe(false);
    expect(result.fileHash).toBe('hash123');
    expect(result.fileName).toBe('test.txt');
  });

  test('应该处理断点续传', async () => {
    // 模拟文件哈希计算
    vi.spyOn(fileChunker as any, 'calculateHash').mockResolvedValue('hash123');

    // 模拟文件检查响应 - 文件部分上传
    mockedAxios.post.mockResolvedValueOnce({
      data: { exists: false, uploadedChunks: [0, 1] } // 前两个分片已上传
    });

    // 模拟分片上传响应
    mockedAxios.post.mockResolvedValue({ data: { success: true } });

    // 模拟合并响应
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, url: '/files/hash123' }
    });

    // 上传文件
    const { promise } = fileChunker.upload(testFile);
    const result = await promise;

    // 验证结果
    expect(result.status).toBe(UploadStatus.SUCCESS);
    expect(result.fileHash).toBe('hash123');
  });

  test('应该处理上传错误', async () => {
    // 模拟文件哈希计算
    vi.spyOn(fileChunker as any, 'calculateHash').mockResolvedValue('hash123');

    // 模拟文件检查响应
    mockedAxios.post.mockResolvedValueOnce({
      data: { exists: false, uploadedChunks: [] }
    });

    // 模拟分片上传错误
    mockedAxios.post.mockRejectedValue(new Error('上传失败'));

    // 上传文件
    const { promise } = fileChunker.upload(testFile);
    const result = await promise;

    // 验证结果
    expect(result.status).toBe(UploadStatus.ERROR);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('上传失败');
  });
});