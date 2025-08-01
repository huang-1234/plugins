/**
 * 服务端示例代码 (Node.js + Express)
 * 此示例仅供参考，实际生产环境需要增加安全验证和错误处理
 */
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// 上传文件存储目录
const uploadDir = path.join(__dirname, 'uploads');
const tempDir = path.join(uploadDir, 'temp');

// 确保目录存在
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// 解析 JSON 请求体
app.use(express.json());

/**
 * 检查文件是否已存在（秒传）
 */
app.post('/api/check', (req, res) => {
  try {
    const { fileHash, fileName } = req.body;

    // 验证参数
    if (!fileHash) {
      return res.status(400).json({ error: '缺少文件哈希' });
    }

    // 完整文件路径
    const filePath = path.join(uploadDir, `${fileHash}`);

    // 检查文件是否已存在（秒传）
    if (fs.existsSync(filePath)) {
      return res.json({ exists: true });
    }

    // 检查临时目录是否存在（断点续传）
    const chunkDir = path.join(tempDir, fileHash);
    let uploadedChunks = [];

    if (fs.existsSync(chunkDir)) {
      // 获取已上传的分片列表
      uploadedChunks = fs.readdirSync(chunkDir)
        .filter(name => name.startsWith('chunk-'))
        .map(name => parseInt(name.split('-')[1]));
    }

    res.json({ exists: false, uploadedChunks });
  } catch (error) {
    console.error('检查文件错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * 上传分片
 */
app.post('/api/upload', multer().single('chunk'), (req, res) => {
  try {
    const { index, fileHash } = req.body;

    // 验证参数
    if (!index || !fileHash || !req.file) {
      return res.status(400).json({ error: '参数不完整' });
    }

    // 创建临时目录
    const chunkDir = path.join(tempDir, fileHash);
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }

    // 保存分片
    const chunkPath = path.join(chunkDir, `chunk-${index}`);
    fs.writeFileSync(chunkPath, req.file.buffer);

    res.json({ success: true });
  } catch (error) {
    console.error('上传分片错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * 合并分片
 */
app.post('/api/merge', async (req, res) => {
  try {
    const { fileHash, fileName, size } = req.body;

    // 验证参数
    if (!fileHash || !fileName) {
      return res.status(400).json({ error: '参数不完整' });
    }

    // 分片目录
    const chunkDir = path.join(tempDir, fileHash);
    if (!fs.existsSync(chunkDir)) {
      return res.status(400).json({ error: '没有找到分片' });
    }

    // 获取所有分片
    const chunks = fs.readdirSync(chunkDir)
      .filter(name => name.startsWith('chunk-'))
      .sort((a, b) => {
        const indexA = parseInt(a.split('-')[1]);
        const indexB = parseInt(b.split('-')[1]);
        return indexA - indexB;
      });

    // 目标文件
    const filePath = path.join(uploadDir, fileHash);
    const writeStream = fs.createWriteStream(filePath);

    // 合并分片
    for (const chunk of chunks) {
      const chunkPath = path.join(chunkDir, chunk);
      const buffer = fs.readFileSync(chunkPath);
      writeStream.write(buffer);
    }

    writeStream.end();

    // 等待文件写入完成
    await new Promise((resolve) => {
      writeStream.on('finish', resolve);
    });

    // 验证文件大小
    const stat = fs.statSync(filePath);
    if (size && stat.size !== parseInt(size)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: '文件大小不匹配' });
    }

    // 保存文件信息（可选，根据需求实现）
    const fileInfo = {
      hash: fileHash,
      name: fileName,
      size: stat.size,
      path: filePath,
      uploadTime: new Date().toISOString()
    };

    // 清理临时分片
    fs.rmSync(chunkDir, { recursive: true, force: true });

    res.json({
      success: true,
      url: `/files/${fileHash}`, // 文件访问URL
      ...fileInfo
    });
  } catch (error) {
    console.error('合并文件错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * 提供文件访问（可选）
 */
app.get('/files/:hash', (req, res) => {
  const { hash } = req.params;
  const filePath = path.join(uploadDir, hash);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('文件不存在');
  }

  res.sendFile(filePath);
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});