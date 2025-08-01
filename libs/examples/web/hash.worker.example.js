/**
 * 文件哈希计算 Web Worker 示例
 *
 * 使用方法:
 * 1. 将此文件保存为 hash.worker.js
 * 2. 在主线程中创建 Worker:
 *    const worker = new Worker('hash.worker.js');
 * 3. 发送文件和分片大小:
 *    worker.postMessage({ file, chunkSize: 5 * 1024 * 1024 });
 * 4. 接收计算结果:
 *    worker.onmessage = (e) => {
 *      if (e.data.type === 'progress') {
 *        // 处理进度
 *        console.log(`哈希计算进度: ${e.data.progress}%`);
 *      } else if (e.data.type === 'complete') {
 *        // 处理结果
 *        console.log(`文件哈希: ${e.data.hash}`);
 *      }
 *    };
 */

// 导入 SparkMD5 库
// 注意: 在实际使用时，需要确保 Worker 可以访问此库
importScripts('https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js');

// 处理主线程消息
self.onmessage = function(e) {
  const { file, chunkSize } = e.data;

  if (!file || !chunkSize) {
    self.postMessage({
      type: 'error',
      error: '缺少必要参数'
    });
    return;
  }

  // 创建 MD5 计算器
  const spark = new SparkMD5.ArrayBuffer();
  const fileReader = new FileReader();
  const chunks = Math.ceil(file.size / chunkSize);
  let currentChunk = 0;

  // 文件加载完成处理
  fileReader.onload = function(e) {
    spark.append(e.target.result);
    currentChunk++;

    // 报告进度
    const progress = Math.floor((currentChunk / chunks) * 100);
    self.postMessage({
      type: 'progress',
      progress,
      currentChunk,
      totalChunks: chunks
    });

    // 继续处理下一个分片或完成
    if (currentChunk < chunks) {
      loadNextChunk();
    } else {
      // 计算完成，返回哈希值
      const hash = spark.end();
      self.postMessage({
        type: 'complete',
        hash
      });
    }
  };

  // 文件读取错误处理
  fileReader.onerror = function() {
    self.postMessage({
      type: 'error',
      error: '文件读取错误'
    });
  };

  // 加载下一个分片
  function loadNextChunk() {
    const start = currentChunk * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end);
    fileReader.readAsArrayBuffer(chunk);
  }

  // 开始处理第一个分片
  loadNextChunk();
};