import Router from 'koa-router';
import path from 'path';
import fs from 'fs';
import { FileService } from '../services/FileService';
import { IKoaRouterContext } from '../types/koa';

const router = new Router();
const fileService = new FileService();

// 文件上传路由
router.post('/', async (ctx) => {
  const files = (ctx.request as any)?.files as { file: File };

  if (!files || !files.file) {
    ctx.status = 400;
    ctx.body = { success: false, message: '没有接收到文件' };
    return;
  }

  // 分片校验逻辑（对接libs/files-buffer）
  const result = await fileService.processUpload(files.file);

  ctx.body = {
    success: true,
    data: { key: result.filePath }
  };
});

// 合并分片
router.post('/merge', async (ctx) => {
  const { fileHash, fileName, size } = (ctx.request as any)?.body as { fileHash: string; fileName: string; size: number };

  if (!fileHash || !fileName) {
    ctx.status = 400;
    ctx.body = { success: false, message: '参数不完整' };
    return;
  }

  const result = await fileService.mergeChunks(fileHash, fileName, size);

  ctx.body = {
    success: true,
    data: { url: result.url }
  };
});

// 检查文件是否已存在
router.post('/check', async (ctx) => {
  const { fileHash, fileName } = (ctx.request as any)?.body as { fileHash: string; fileName: string };

  if (!fileHash) {
    ctx.status = 400;
    ctx.body = { success: false, message: '参数不完整' };
    return;
  }

  const result = await fileService.checkFileExists(fileHash, fileName);

  ctx.body = {
    success: true,
    data: result
  };
});

export const fileRoutes = router;