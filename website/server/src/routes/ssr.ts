import Router from 'koa-router';
import type { Context } from 'koa';
import { renderToStream } from '../services/ssr/index.js';

// 创建SSR路由
const router = new Router();

/**
 * SSR路由处理
 *
 * @swagger
 * /ssr:
 *   get:
 *     summary: 服务端渲染React应用
 *     description: 返回服务端渲染的React应用HTML
 *     tags: [SSR]
 *     responses:
 *       200:
 *         description: 成功返回HTML
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       500:
 *         description: 服务器错误
 */
router.get('/ssr', async (ctx: Context) => {
  await renderToStream(ctx, ctx.url);
});

/**
 * SSR子路由处理
 * 处理/ssr/*下的所有路由
 */
router.get('/ssr/(.*)', async (ctx: Context) => {
  // 提取实际路径
  const path = ctx.path.replace(/^\/ssr/, '') || '/';
  await renderToStream(ctx, path);
});

// 导出SSR路由
export default router;