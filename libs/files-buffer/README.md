# Files-Buffer 大文件分片上传库

基于 React 18.2.0+、TypeScript 5.8.3 和原生 HTML5 事件/控件实现的大文件分片上传方案，支持**分片上传、断点续传、秒传**功能。

## 功能特点

- ✅ 文件分片上传：使用 `Blob.slice()` 切割大文件
- ✅ 断点续传：记录已上传分片，支持页面刷新后继续上传
- ✅ 秒传：基于文件哈希验证，避免重复上传
- ✅ 并发控制：可配置同时上传的分片数量
- ✅ Web Worker：使用 Worker 线程计算文件哈希，避免主线程阻塞
- ✅ 进度监控：精确的上传进度反馈
- ✅ 暂停/恢复/取消：完整的上传控制功能
- ✅ React 组件：内置 React 上传组件

## 安装

```bash
pnpm install
```

## 构建

```bash
pnpm build
```

## 开发模式

```bash
pnpm dev
```

## 使用示例

### React 组件用法

```tsx
import { FileUploader } from 'files-buffer';

const App = () => {
  return (
    <div>
      <h1>文件上传示例</h1>
      <FileUploader
        baseUrl="/api"
        chunkSize={5 * 1024 * 1024} // 5MB 分片
        concurrentLimit={3}
        onSuccess={(result) => {
          console.log('上传成功:', result);
        }}
        onError={(error) => {
          console.error('上传失败:', error);
        }}
        onProgress={(info) => {
          console.log(`上传进度: ${info.percent}%`);
        }}
      />
    </div>
  );
};
```

### 核心 API 直接使用

```tsx
import { FileChunker, UploadStatus } from 'files-buffer';

// 创建上传管理器
const chunker = new FileChunker({
  baseUrl: '/api',
  chunkSize: 5 * 1024 * 1024, // 5MB
  concurrentLimit: 3,
  useWorker: true
});

// 开始上传
const handleUpload = async (file: File) => {
  const { controller, promise } = chunker.upload(
    file,
    (progressInfo) => {
      console.log(`上传进度: ${progressInfo.percent}%`);
    },
    (hashProgress) => {
      console.log(`哈希计算进度: ${hashProgress}%`);
    }
  );

  // 控制上传
  // controller.pause(); // 暂停
  // controller.resume(); // 恢复
  // controller.cancel(); // 取消

  try {
    const result = await promise;

    if (result.status === UploadStatus.SUCCESS) {
      console.log('上传成功:', result);
    } else if (result.status === UploadStatus.QUICK_SUCCESS) {
      console.log('秒传成功:', result);
    } else {
      console.error('上传失败:', result.error);
    }
  } catch (error) {
    console.error('上传异常:', error);
  }
};
```

## 服务端接口要求

服务端需要实现以下接口：

### 1. 检查文件是否存在（用于秒传）

```
POST /api/check
```

请求体：
```json
{
  "fileHash": "文件哈希值",
  "fileName": "文件名"
}
```

响应：
```json
{
  "exists": true/false,
  "uploadedChunks": [0, 1, 2] // 可选，已上传的分片索引
}
```

### 2. 上传分片

```
POST /api/upload
```

请求体 (multipart/form-data):
```
chunk: Blob,
index: 分片索引,
fileHash: 文件哈希值,
fileName: 文件名
```

### 3. 合并分片

```
POST /api/merge
```

请求体：
```json
{
  "fileHash": "文件哈希值",
  "fileName": "文件名",
  "size": 文件大小
}
```
