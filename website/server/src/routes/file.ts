import Router from 'koa-router';
import path from 'path';
import fs from 'fs';
import { FileService } from '../services/FileService';

const router = new Router();
const fileService = new FileService();

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: 上传文件分片
 *     description: 上传文件分片
 *     tags: [文件]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: header
 *         name: Content-Range
 *         schema:
 *           type: string
 *         description: 分片范围，格式为bytes start-end/total
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               hash:
 *                 type: string
 *               index:
 *                 type: string
 *     responses:
 *       200:
 *         description: 成功响应
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.post('/', async (ctx) => {
  const files = (ctx.request as any).files as { file: any };

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

/**
 * @swagger
 * /upload/merge:
 *   post:
 *     summary: 合并文件分片
 *     description: 合并已上传的文件分片
 *     tags: [文件]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileHash
 *               - fileName
 *             properties:
 *               fileHash:
 *                 type: string
 *                 description: 文件哈希值
 *               fileName:
 *                 type: string
 *                 description: 文件名
 *               size:
 *                 type: number
 *                 description: 文件大小
 *     responses:
 *       200:
 *         description: 成功响应
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.post('/merge', async (ctx) => {
  const { fileHash, fileName, size } = ctx.request.body as { fileHash: string, fileName: string, size: number };

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

/**
 * @swagger
 * /upload/check:
 *   post:
 *     summary: 检查文件是否存在
 *     description: 检查文件是否已上传，支持秒传和断点续传
 *     tags: [文件]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileHash
 *             properties:
 *               fileHash:
 *                 type: string
 *                 description: 文件哈希值
 *               fileName:
 *                 type: string
 *                 description: 文件名
 *     responses:
 *       200:
 *         description: 成功响应
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     exists:
 *                       type: boolean
 *                     url:
 *                       type: string
 *                     uploadedChunks:
 *                       type: array
 *                       items:
 *                         type: number
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.post('/check', async (ctx) => {
  const { fileHash, fileName } = ctx.request.body as { fileHash: string, fileName: string };

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