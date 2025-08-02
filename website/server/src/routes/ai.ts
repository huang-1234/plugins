import Router from 'koa-router';
import { AIService } from '../services/AIService';

const router = new Router();
const aiService = new AIService();

// LangChain代理路由
router.post('/chat', async (ctx) => {
  const { message, history } = ctx.request.body;

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

// 流式响应
router.post('/stream', async (ctx) => {
  const { message, history } = ctx.request.body;

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