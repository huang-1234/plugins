import Router from 'koa-router';
import { AIService } from '../services/ai-service';

const router = new Router();
const aiService = new AIService();

/**
 * @swagger
 * /ai/chat:
 *   post:
 *     summary: 聊天接口
 *     description: 与AI进行对话
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: 用户发送的消息
 *               history:
 *                 type: array
 *                 description: 对话历史
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant, system]
 *                     content:
 *                       type: string
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
 *                     content:
 *                       type: string
 *                     id:
 *                       type: string
 *                     model:
 *                       type: string
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.post('/chat', async (ctx) => {
  const { message, history } = (ctx.request as any)?.body as { message: string; history?: any[] };

  if (!message) {
    ctx.status = 400;
    ctx.body = { success: false, message: '消息内容不能为空' };
    return;
  }

  try {
    const result = await aiService.processChat(message, history);
    ctx.body = {
      success: true,
      data: result
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `AI处理失败: ${error.message}`
    };
  }
});

/**
 * @swagger
 * /ai/stream:
 *   post:
 *     summary: 流式聊天接口
 *     description: 与AI进行流式对话，支持实时响应
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: 用户发送的消息
 *               history:
 *                 type: array
 *                 description: 对话历史
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant, system]
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: 流式响应
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       400:
 *         description: 请求错误
 *       500:
 *         description: 服务器错误
 */
router.post('/stream', async (ctx) => {
  const { message, history } = (ctx.request as any)?.body as { message: string; history?: any[] };

  if (!message) {
    ctx.status = 400;
    ctx.body = { success: false, message: '消息内容不能为空' };
    return;
  }

  ctx.set('Content-Type', 'text/event-stream');
  ctx.set('Cache-Control', 'no-cache');
  ctx.set('Connection', 'keep-alive');

  const stream = await aiService.streamChat(message, history);

  // 将流式响应推送给客户端
  stream.on('data', (chunk) => {
    ctx.res.write(`data: ${JSON.stringify({ content: chunk.toString() })}\n\n`);
  });

  stream.on('end', () => {
    ctx.res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    ctx.res.end();
  });

  stream.on('error', (err) => {
    console.error('Stream error:', err);
    ctx.res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    ctx.res.end();
  });

  // 处理客户端断开连接
  ctx.req.on('close', () => {
    stream.destroy();
  });
});

export const aiRoutes = router;