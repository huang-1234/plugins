import { describe, expect, test, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUploader, UploadStatus } from '../src';
import '@testing-library/jest-dom';

// 模拟 FileChunker
vi.mock('../src/fileChunker', () => {
  const mockUpload = vi.fn().mockImplementation(() => {
    return {
      controller: {
        pause: vi.fn(),
        resume: vi.fn(),
        cancel: vi.fn(),
        status: UploadStatus.UPLOADING
      },
      promise: Promise.resolve({
        status: UploadStatus.SUCCESS,
        fileHash: 'test-hash',
        fileName: 'test.txt',
        fileSize: 1024,
        isQuickUpload: false
      })
    };
  });

  return {
    FileChunker: class {
      constructor() {}
      upload = mockUpload;
    }
  };
});

describe('FileUploader', () => {
  beforeEach(() => {
    // 清除模拟
    vi.clearAllMocks();
  });

  test('应该正确渲染', () => {
    render(<FileUploader baseUrl="http://test-api.com" />);

    // 检查按钮是否存在
    expect(screen.getByRole('button', { name: /选择文件/i })).toBeInTheDocument();
  });

  test('应该处理文件选择', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onProgress = vi.fn();

    render(
      <FileUploader
        baseUrl="http://test-api.com"
        onSuccess={onSuccess}
        onError={onError}
        onProgress={onProgress}
      />
    );

    // 获取文件输入
    const fileInput = screen.getByTitle('选择要上传的文件');

    // 模拟文件选择
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // 等待上传完成
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });

    // 验证回调
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({
      status: UploadStatus.SUCCESS,
      fileName: 'test.txt'
    }));
    expect(onError).not.toHaveBeenCalled();
  });

  test('应该显示上传进度', async () => {
    // 重新模拟 FileChunker 以提供进度回调
    vi.mock('../src/fileChunker', () => {
      return {
        FileChunker: class {
          constructor() {}
          upload = vi.fn().mockImplementation((file, onProgress) => {
            // 触发进度回调
            setTimeout(() => {
              onProgress?.({
                percent: 50,
                loaded: 512,
                total: 1024,
                currentChunk: 1,
                totalChunks: 2
              });
            }, 10);

            return {
              controller: {
                pause: vi.fn(),
                resume: vi.fn(),
                cancel: vi.fn(),
                status: UploadStatus.UPLOADING
              },
              promise: new Promise(resolve => {
                setTimeout(() => {
                  resolve({
                    status: UploadStatus.SUCCESS,
                    fileHash: 'test-hash',
                    fileName: 'test.txt',
                    fileSize: 1024,
                    isQuickUpload: false
                  });
                }, 50);
              })
            };
          })
        }
      };
    });

    render(<FileUploader baseUrl="http://test-api.com" />);

    // 获取文件输入
    const fileInput = screen.getByTitle('选择要上传的文件');

    // 模拟文件选择
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // 等待进度显示
    await waitFor(() => {
      expect(screen.getByText(/上传进度:/)).toBeInTheDocument();
    });

    // 等待上传完成
    await waitFor(() => {
      expect(screen.getByText(/上传成功/)).toBeInTheDocument();
    });
  });

  test('应该处理上传错误', async () => {
    // 重新模拟 FileChunker 以提供错误
    vi.mock('../src/fileChunker', () => {
      return {
        FileChunker: class {
          constructor() {}
          upload = vi.fn().mockImplementation(() => {
            return {
              controller: {
                pause: vi.fn(),
                resume: vi.fn(),
                cancel: vi.fn(),
                status: UploadStatus.UPLOADING
              },
              promise: Promise.resolve({
                status: UploadStatus.ERROR,
                fileHash: '',
                fileName: 'test.txt',
                fileSize: 1024,
                isQuickUpload: false,
                error: new Error('上传失败')
              })
            };
          })
        }
      };
    });

    const onError = vi.fn();
    render(<FileUploader baseUrl="http://test-api.com" onError={onError} />);

    // 获取文件输入
    const fileInput = screen.getByTitle('选择要上传的文件');

    // 模拟文件选择
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    // 等待错误显示
    await waitFor(() => {
      expect(screen.getByText(/错误:/)).toBeInTheDocument();
    });

    // 验证回调
    expect(onError).toHaveBeenCalled();
  });
});