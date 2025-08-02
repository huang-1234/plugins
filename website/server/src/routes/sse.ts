import Router from 'koa-router';
import { SystemService } from '../services/SystemService';
import { sseMiddleware } from '../middleware/sse';

const router = new Router();
const systemService = new SystemService();

// SSE消息推送
router.get('/sse', async (ctx) => {
  router.use(sseMiddleware);
  // 保持连接
  ctx.req.socket.setTimeout(0);
  ctx.req.socket.setNoDelay(true);
  ctx.req.socket.setKeepAlive(true);

  const sendEvent = (data: any) => {
    ctx.res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // 发送初始连接成功消息
  sendEvent({ type: 'connected', time: Date.now() });

  // 设置定时发送系统状态
  const intervalId = setInterval(() => {
    const status = systemService.getSystemStatus();
    sendEvent({ type: 'status', data: status, time: Date.now() });
  }, 5000);

  // 处理客户端断开连接
  ctx.req.on('close', () => {
    clearInterval(intervalId);
  });
});

export const sseRoutes = router;