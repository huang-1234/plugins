import Koa from 'koa';
import cors from 'koa-cors';
import bodyParser from 'koa-bodyparser';
import jwt from 'koa-jwt';
import Router from 'koa-router';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileRoutes } from './routes/file';
import { aiRoutes } from './routes/ai';
import { sseRoutes } from './routes/sse';
import { docRoutes } from './routes/doc';

// 加载环境变量
dotenv.config();

const app = new Koa();
const router = new Router();

// JWT鉴权中间件
app.use(jwt({
  secret: process.env.JWT_SECRET || 'default_secret',
  passthrough: true // 允许文档接口免认证
}).unless({ path: [/^\/docs/] }));

// 跨域配置
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// 注册路由
router.use('/api/upload', fileRoutes.routes());
router.use('/api/ai', aiRoutes.routes());
router.use('/docs', docRoutes.routes());
router.use(sseRoutes.routes());

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

// 注册中间件
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务
const PORT = process.env.PORT || 7788;
app.listen(PORT, () => {
  console.log(`服务器已启动，监听端口: ${PORT}`);
});

// 导出app实例，用于测试
export default app;