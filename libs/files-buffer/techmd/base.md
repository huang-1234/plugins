以下基于 React 18.2.0+、TypeScript 5.8.3 和原生 HTML5 事件/控件实现的大文件分片上传方案，结合 `spark-md5` 计算文件指纹，支持**分片上传、断点续传、秒传**功能。所有代码可直接用于 Cursor 开发环境。

---

### **一、核心实现流程**
1. **文件分片**：使用 `Blob.slice()` 切割文件
2. **哈希计算**：基于 `crypto.subtle.digest('SHA-256', data)` 和 `Spark-MD5` 进行文件指纹计算、生成文件唯一标识（秒传/断点续传依据）
3. **分片上传**：原生 `FormData` 发送分片，支持并发控制
4. **断点续传**：服务端记录已上传分片索引，前端跳过已传分片
5. **秒传**：服务端校验文件哈希，存在则直接返回成功
6. **合并请求**：所有分片上传完成后触发服务端合并

---

### **二、关键代码实现（TS + React）**
#### 1. 文件分片与哈希计算
```tsx
import SparkMD5 from 'spark-md5';

// 分片大小 (5MB)
const CHUNK_SIZE = 5 * 1024 * 1024;

/**
 * 生成文件哈希（唯一标识）
 * @param file 用户选择的文件
 * @returns 文件MD5哈希值
 */
const calculateFileHash = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const spark = new SparkMD5.ArrayBuffer();
    const fileReader = new FileReader();
    let currentChunk = 0;

    fileReader.onload = (e) => {
      spark.append(e.target?.result as ArrayBuffer);
      currentChunk++;

      if (currentChunk < Math.ceil(file.size / CHUNK_SIZE)) {
        loadNextChunk();
      } else {
        resolve(spark.end()); // 最终哈希值
      }
    };

    const loadNextChunk = () => {
      const start = currentChunk * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunk = file.slice(start, end);
      fileReader.readAsArrayBuffer(chunk);
    };

    loadNextChunk();
  });
};

/**
 * 切割文件为分片数组
 * @param file 用户选择的文件
 * @returns 分片数组
 */
const splitFileToChunks = (file: File): Blob[] => {
  const chunks: Blob[] = [];
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    chunks.push(chunk);
    offset += CHUNK_SIZE;
  }

  return chunks;
};
```

#### 2. 上传组件（使用原生 input）
```tsx
import { useState, useRef } from 'react';
import axios from 'axios';

const FileUploader = () => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileChange = () => {
    if (!fileInputRef.current?.files?.[0]) return;
    startUpload(fileInputRef.current.files[0]);
  };

  // 开始上传流程
  const startUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // 1. 计算文件哈希
      const fileHash = await calculateFileHash(file);

      // 2. 秒传验证
      const { data } = await axios.post('/api/check', { fileHash });
      if (data.exists) {
        alert('秒传成功！');
        return;
      }

      // 3. 分片上传
      const chunks = splitFileToChunks(file);
      const uploadedIndexes = data.uploadedChunks || []; // 服务端返回已上传索引

      for (let i = 0; i < chunks.length; i++) {
        if (uploadedIndexes.includes(i)) {
          updateProgress(i, chunks.length); // 跳过已上传
          continue;
        }

        const formData = new FormData();
        formData.append('chunk', chunks[i]);
        formData.append('index', i.toString());
        formData.append('fileHash', fileHash);

        await axios.post('/api/upload', formData, {
          onUploadProgress: (e) => {
            const chunkProgress = (e.loaded / e.total!) * 100;
            const totalProgress = ((i + chunkProgress / 100) / chunks.length) * 100;
            setUploadProgress(totalProgress);
          }
        });
      }

      // 4. 合并文件
      await axios.post('/api/merge', { fileHash, fileName: file.name });
      alert('上传成功！');
    } catch (error) {
      console.error('上传失败:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // 更新进度条
  const updateProgress = (currentIndex: number, totalChunks: number) => {
    const progress = ((currentIndex + 1) / totalChunks) * 100;
    setUploadProgress(progress);
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isUploading}
        style={{ display: 'none' }}
      />
      <button onClick={() => fileInputRef.current?.click()}>
        {isUploading ? '上传中...' : '选择文件'}
      </button>
      {uploadProgress > 0 && (
        <div>
          <progress value={uploadProgress} max="100" />
          <span>{uploadProgress.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
};
```

---

### **三、服务端关键接口（Node.js示例）**
```javascript
// 检查文件状态（秒传/断点续传）
app.post('/api/check', (req, res) => {
  const { fileHash } = req.body;
  const filePath = path.join(uploadDir, `${fileHash}.complete`);

  // 文件已存在 → 秒传
  if (fs.existsSync(filePath)) {
    return res.json({ exists: true });
  }

  // 检查已上传的分片
  const chunkDir = path.join(uploadDir, fileHash);
  const uploadedChunks = fs.existsSync(chunkDir)
    ? fs.readdirSync(chunkDir).map(name => parseInt(name.split('-')[1]))
    : [];

  res.json({ exists: false, uploadedChunks });
});

// 分片上传
app.post('/api/upload', multer().single('chunk'), (req, res) => {
  const { index, fileHash } = req.body;
  const chunkDir = path.join(uploadDir, fileHash);

  if (!fs.existsSync(chunkDir)) fs.mkdirSync(chunkDir);

  const chunkPath = path.join(chunkDir, `chunk-${index}`);
  fs.writeFileSync(chunkPath, req.file.buffer); // 保存分片
  res.status(200).send();
});

// 合并文件
app.post('/api/merge', async (req, res) => {
  const { fileHash, fileName } = req.body;
  const chunkDir = path.join(uploadDir, fileHash);
  const chunks = fs.readdirSync(chunkDir).sort((a, b) =>
    parseInt(a.split('-')[1]) - parseInt(b.split('-')[1])
  );

  const writeStream = fs.createWriteStream(`${uploadDir}/${fileHash}.complete`);
  for (const chunk of chunks) {
    writeStream.write(fs.readFileSync(path.join(chunkDir, chunk)));
  }
  writeStream.end();
  res.send('合并成功');
});
```

---

### **四、优化策略**
1. **Web Worker 加速哈希计算**
   将 `spark-md5` 计算移至 Worker 线程，避免主线程卡顿：
   ```ts
   const worker = new Worker('hash.worker.js');
   worker.postMessage({ file, CHUNK_SIZE });
   worker.onmessage = (e) => setFileHash(e.data.hash);
   ```

2. **并发控制**
   使用 `Promise.allSettled` 限制并发请求数（如 5 个并行）：
   ```ts
   const parallelLimit = 5;
   for (let i = 0; i < chunks.length; i += parallelLimit) {
     await Promise.all(chunks.slice(i, i + parallelLimit).map(uploadChunk));
   }
   ```

3. **断点恢复**
   本地存储已上传分片索引（IndexedDB），页面关闭后恢复：
   ```ts
   // 读取本地存储的进度
   const savedProgress = localStorage.getItem(fileHash);
   const uploadedIndexes = savedProgress ? JSON.parse(savedProgress) : [];
   ```

---

### **五、完整依赖**
```json
// package.json
{
  "dependencies": {
    "react": "18.2.0",
    "axios": "1.11.0",
    "spark-md5": "3.0.2",
    "multer": "1.4.5",        // 服务端文件处理
    "express": "4.19.2"       // 服务端框架
  }
}
```
