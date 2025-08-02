/**
 * 服务端示例代码 (Node.js + Koa)
 * 此示例仅供参考，实际生产环境需要增加安全验证和错误处理
 */
const Koa = require('koa');
const Router = require('koa-router');
const { koaBody } = require('koa-body');
const fs = require('fs');
const path = require('path');
const cors = require('koa-cors');
const send = require('koa-send');
const { promisify } = require('util');

const app = new Koa();
const router = new Router();
const port = 3000;

// 上传文件存储目录
const uploadDir = path.join(__dirname, 'uploads');
const tempDir = path.join(uploadDir, 'temp');

// 确保目录存在
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// 使用中间件
app.use(cors()); // 允许跨域请求
app.use(koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 200 * 1024 * 1024, // 限制单个分片大小 200MB
    keepExtensions: true,
    uploadDir: tempDir, // 临时文件保存目录
    createParentPath: true // 自动创建父目录
  }
}));

router.get('/api/test', async (ctx) => {
  ctx.body = { message: 'Hello, World!' };
});

/**
 * 检查文件是否已存在（秒传）
 */
router.post('/api/check', async (ctx) => {
  try {
    const { fileHash, fileName } = ctx.request.body;

    // 验证参数
    if (!fileHash) {
      ctx.status = 400;
      ctx.body = { error: '缺少文件哈希' };
      return;
    }

    // 获取文件扩展名
    const fileExt = fileName ? path.extname(fileName) : '';

    // 完整文件路径（带扩展名）
    const filePath = path.join(uploadDir, `${fileHash}${fileExt}`);

    // 检查文件是否已存在（秒传）
    if (fs.existsSync(filePath)) {
      ctx.body = { exists: true, url: `/files/${fileHash}${fileExt}` };
      return;
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

    ctx.body = { exists: false, uploadedChunks };
  } catch (error) {
    console.error('检查文件错误:', error);
    ctx.status = 500;
    ctx.body = { error: '服务器错误' };
  }
});

/**
 * 上传分片
 */
router.post('/api/upload', async (ctx) => {
  try {
    const { index, fileHash } = ctx.request.body;
    const chunk = ctx.request.files?.chunk;

    // 验证参数
    if (!index || !fileHash || !chunk) {
      ctx.status = 400;
      ctx.body = { error: '参数不完整' };
      return;
    }

    // 创建临时目录
    const chunkDir = path.join(tempDir, fileHash);
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }

    // 获取上传的临时文件路径
    const filePath = Array.isArray(chunk) ? chunk[0].filepath : chunk.filepath;

    // 确保文件存在
    if (!fs.existsSync(filePath)) {
      ctx.status = 400;
      ctx.body = { error: '临时文件不存在', path: filePath };
      return;
    }

    // 读取上传的临时文件
    const reader = fs.createReadStream(filePath);
    // 创建写入流
    const chunkPath = path.join(chunkDir, `chunk-${index}`);
    const writer = fs.createWriteStream(chunkPath);

    // 通过管道将读取流数据写入写入流
    reader.pipe(writer);

    // 等待写入完成
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    ctx.body = { success: true };
  } catch (error) {
    console.error('上传分片错误:', error);
    ctx.status = 500;
    ctx.body = { error: '服务器错误' };
  }
});

/**
 * 合并分片
 */
router.post('/api/merge', async (ctx) => {
  try {
    const { fileHash, fileName, size } = ctx.request.body;

    // 验证参数
    if (!fileHash || !fileName) {
      ctx.status = 400;
      ctx.body = { error: '参数不完整' };
      return;
    }

    // 分片目录
    const chunkDir = path.join(tempDir, fileHash);
    if (!fs.existsSync(chunkDir)) {
      ctx.status = 400;
      ctx.body = { error: '没有找到分片' };
      return;
    }

    // 获取所有分片
    const chunks = fs.readdirSync(chunkDir)
      .filter(name => name.startsWith('chunk-'))
      .sort((a, b) => {
        const indexA = parseInt(a.split('-')[1]);
        const indexB = parseInt(b.split('-')[1]);
        return indexA - indexB;
      });

    // 获取文件扩展名
    const fileExt = fileName ? path.extname(fileName) : '';

    // 目标文件（带扩展名）
    const filePath = path.join(uploadDir, `${fileHash}${fileExt}`);
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
      ctx.status = 400;
      ctx.body = { error: '文件大小不匹配' };
      return;
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

    ctx.body = {
      success: true,
      url: `/files/${fileHash}${fileExt}`, // 文件访问URL（带扩展名）
      ...fileInfo
    };
  } catch (error) {
    console.error('合并文件错误:', error);
    ctx.status = 500;
    ctx.body = { error: '服务器错误' };
  }
});

/**
 * 提供文件访问（可选）
 */
router.get('/files/:hash', async (ctx) => {
  const { hash } = ctx.params;

  // 尝试查找带扩展名和不带扩展名的文件
  let filePath = path.join(uploadDir, hash);
  let fileName = hash;

  // 如果直接找不到文件，尝试查找目录中可能匹配的文件
  if (!fs.existsSync(filePath)) {
    const files = fs.readdirSync(uploadDir);
    const matchingFile = files.find(file => file.startsWith(hash));

    if (matchingFile) {
      filePath = path.join(uploadDir, matchingFile);
      fileName = matchingFile;
    } else {
      ctx.status = 404;
      ctx.body = '文件不存在';
      return;
    }
  }

  // 使用koa-send发送文件
  await send(ctx, fileName, { root: uploadDir });
});

// 注册路由
app.use(router.routes()).use(router.allowedMethods());

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});