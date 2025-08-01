import SparkMD5 from 'spark-md5';

// 声明 Worker 类型
declare const self: Worker;

/**
 * Web Worker 用于计算文件哈希
 * 接收消息格式: { file: File, chunkSize: number }
 * 发送消息格式: { hash: string }
 */
self.onmessage = async (e: MessageEvent) => {
  const { file, chunkSize } = e.data;
  const fileReader = new FileReader();
  const spark = new SparkMD5.ArrayBuffer();
  const chunks = Math.ceil(file.size / chunkSize);
  let currentChunk = 0;

  fileReader.onload = (e) => {
    spark.append((e.target?.result as ArrayBuffer));
    currentChunk++;

    if (currentChunk < chunks) {
      // 报告进度
      self.postMessage({
        type: 'progress',
        progress: Math.floor((currentChunk / chunks) * 100),
        currentChunk,
        totalChunks: chunks
      });
      loadNextChunk();
    } else {
      // 完成计算
      const hash = spark.end();
      self.postMessage({
        type: 'complete',
        hash
      });
    }
  };

  fileReader.onerror = () => {
    self.postMessage({
      type: 'error',
      error: 'FileReader error'
    });
  };

  const loadNextChunk = () => {
    const start = currentChunk * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end);
    fileReader.readAsArrayBuffer(chunk);
  };

  // 开始读取第一个分片
  loadNextChunk();
};

export {};