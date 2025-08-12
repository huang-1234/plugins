import Koa from 'koa';
import Router from 'koa-router';
import serve from 'koa-static';
import path from 'path';
import { fileURLToPath } from 'url';
import render from './render.js';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Koa();
const router = new Router();

// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      message: err.message || '服务器内部错误'
    };
    console.error(`[SSR Error] ${err.message}`, err.stack);
    ctx.app.emit('error', err, ctx);
  }
});

// 静态资源中间件 - 生产环境使用构建后的静态资源
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.resolve(__dirname, '../../../public/dist/client');
  app.use(serve(staticPath));
}

// SSR路由处理 - 所有路由都通过SSR渲染
router.get('/ssr', async (ctx) => {
  await render(ctx);
});

app.use(router.routes()).use(router.allowedMethods());

// 错误事件监听
app.on('error', (err, ctx) => {
  console.error('Server Error:', err);
});

// 端口配置
const PORT = process.env.PORT || 3000;

// 启动服务器
app.listen(PORT, () => {
  console.log(`SSR Server running on http://localhost:${PORT}`);
});

export default app;