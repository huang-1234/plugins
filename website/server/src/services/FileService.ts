import fs from 'fs';
import path from 'path';

export class FileService {
  private uploadDir: string;
  private chunkDir: string;

  constructor() {
    this.uploadDir = path.resolve(__dirname, '../../uploads');
    this.chunkDir = path.resolve(__dirname, '../../uploads/chunks');

    // 确保目录存在
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    if (!fs.existsSync(this.chunkDir)) {
      fs.mkdirSync(this.chunkDir, { recursive: true });
    }
  }

  /**
   * 处理文件上传
   */
  async processUpload(file: any) {
    const { hash, index } = file;
    const chunkDir = path.join(this.chunkDir, hash);

    // 确保分片目录存在
    if (!fs.existsSync(chunkDir)) {
      fs.mkdirSync(chunkDir, { recursive: true });
    }

    // 保存分片
    const chunkPath = path.join(chunkDir, `${index}`);
    const reader = fs.createReadStream(file.path);
    const writer = fs.createWriteStream(chunkPath);

    await new Promise((resolve, reject) => {
      reader.pipe(writer);
      reader.on('end', resolve);
      reader.on('error', reject);
    });

    return { success: true, filePath: chunkPath };
  }

  /**
   * 合并文件分片
   */
  async mergeChunks(fileHash: string, fileName: string, size: number) {
    const chunkDir = path.join(this.chunkDir, fileHash);
    const filePath = path.join(this.uploadDir, fileName);

    // 获取所有分片
    const chunks = await fs.promises.readdir(chunkDir);

    // 按索引排序
    chunks.sort((a, b) => parseInt(a) - parseInt(b));

    // 创建写入流
    const writeStream = fs.createWriteStream(filePath);

    // 依次写入每个分片
    for (const chunk of chunks) {
      const chunkPath = path.join(chunkDir, chunk);
      const buffer = await fs.promises.readFile(chunkPath);
      writeStream.write(buffer);
    }

    writeStream.end();

    // 返回文件URL
    const fileUrl = `/uploads/${fileName}`;

    return { success: true, url: fileUrl };
  }

  /**
   * 检查文件是否已存在
   */
  async checkFileExists(fileHash: string, fileName: string) {
    const filePath = path.join(this.uploadDir, fileName);

    // 检查完整文件是否存在
    if (fs.existsSync(filePath)) {
      return {
        exists: true,
        url: `/uploads/${fileName}`
      };
    }

    // 检查是否有部分分片
    const chunkDir = path.join(this.chunkDir, fileHash);

    if (fs.existsSync(chunkDir)) {
      const chunks = await fs.promises.readdir(chunkDir);
      return {
        exists: false,
        uploadedChunks: chunks.map(chunk => parseInt(chunk))
      };
    }

    return { exists: false };
  }
}