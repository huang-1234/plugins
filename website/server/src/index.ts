import Koa from 'koa';
import cors from 'koa-cors';
import bodyParser from 'koa-bodyparser';
import jwt from 'koa-jwt';
import Router from 'koa-router';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import serve from 'koa-static';
import { fileRoutes } from './routes/file.js';
import { aiRoutes } from './routes/ai.js';
import { sseRoutes } from './routes/sse.js';
import { docRoutes } from './routes/doc.js';
import ssrRoutes from './routes/ssr.js';
import { setupSwagger } from './swagger/index.js';

// 加载环境变量
dotenv.config();

const app = new Koa();
const router = new Router();

// 静态文件服务
app.use(serve(path.join(__dirname, '../public')));

// JWT鉴权中间件
app.use(jwt({
  secret: process.env.JWT_SECRET || 'default_secret',
  passthrough: true // 允许文档接口免认证
}).unless({ path: [/^\/docs/, /^\/swagger/, /^\/swagger.json/] }));

// 跨域配置
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// 注册中间件
app.use(bodyParser());

// 设置Swagger
setupSwagger(app);

// 注册路由
router.use('/api/upload', fileRoutes.routes());
router.use('/api/ai', aiRoutes.routes());
router.use('/api/docs', docRoutes.routes());
router.use(sseRoutes.routes());
router.use(ssrRoutes.routes());

// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      message: err.message || '服务器内部错误'
    };
    console.error(`[Error] ${err.message}`, err.stack);
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务
const findAvailablePort = async (startPort: number): Promise<number> => {
  const net = require('net');

  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();

    let port = startPort;

    server.on('error', () => {
      // 端口被占用，尝试下一个端口
      port++;
      server.listen(port);
    });

    server.on('listening', () => {
      // 找到可用端口
      server.close(() => {
        resolve(port);
      });
    });

    server.listen(port);
  });
};

// 启动服务器
(async () => {
  const preferredPort = parseInt(process.env.PORT || '7788');
  const port = await findAvailablePort(preferredPort);

  app.listen(port, () => {
    console.log(`服务器已启动，监听端口: ${port}`);
    console.log(`服务器地址为 http://localhost:${port}`);
    console.log(`Swagger文档地址: http://localhost:${port}/swagger`);
  });
})();

// 导出app实例，用于测试
export default app;