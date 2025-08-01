# 大文件分片上传Koa服务端示例

这是一个使用Koa实现的大文件分片上传服务端示例，配合files-buffer前端库使用。

## 功能特点

- 支持大文件分片上传
- 支持断点续传
- 支持秒传（文件已存在时）
- 文件哈希校验

## 安装依赖

```bash
npm install
# 或者
yarn
# 或者
pnpm install
```

## 启动服务

```bash
npm start
# 或者
yarn start
# 或者
pnpm start
```

开发模式（自动重启）:

```bash
npm run dev
# 或者
yarn dev
# 或者
pnpm dev
```

服务将在 http://localhost:3000 上运行。

## API接口

### 1. 检查文件是否已存在（秒传）

- **URL**: `/api/check`
- **方法**: `POST`
- **参数**:
  - `fileHash`: 文件哈希值
  - `fileName`: 文件名
- **响应**:
  - 文件已存在: `{ exists: true }`
  - 文件不存在: `{ exists: false, uploadedChunks: [] }`

### 2. 上传分片

- **URL**: `/api/upload`
- **方法**: `POST`
- **参数**:
  - `chunk`: 文件分片（FormData）
  - `index`: 分片索引
  - `fileHash`: 文件哈希值
- **响应**: `{ success: true }`

### 3. 合并分片

- **URL**: `/api/merge`
- **方法**: `POST`
- **参数**:
  - `fileHash`: 文件哈希值
  - `fileName`: 文件名
  - `size`: 文件大小（可选）
- **响应**:
  ```json
  {
    "success": true,
    "url": "/files/[fileHash]",
    "hash": "[fileHash]",
    "name": "[fileName]",
    "size": 12345,
    "path": "/path/to/file",
    "uploadTime": "2023-07-01T12:00:00.000Z"
  }
  ```

### 4. 访问文件

- **URL**: `/files/:hash`
- **方法**: `GET`
- **响应**: 文件内容

## 目录结构

- `uploads/`: 存储上传完成的文件
- `uploads/temp/`: 存储临时分片文件

## 注意事项

- 此示例仅供参考，实际生产环境需要增加安全验证和错误处理
- 默认限制单个分片大小为200MB
- 文件存储使用文件哈希值作为文件名，避免文件名冲突