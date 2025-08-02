import swaggerJSDoc from 'swagger-jsdoc';
import { koaSwagger } from 'koa2-swagger-ui';
import { Context, Next } from 'koa';
import Router from 'koa-router';
import path from 'path';

// Swagger定义
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: '项目网站API文档',
    version: '1.0.0',
    description: '项目网站后端API接口文档',
    contact: {
      name: '技术团队',
      email: 'tech@example.com'
    }
  },
  servers: [
    {
      url: '/api',
      description: 'API服务器'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

// Swagger配置
const options = {
  swaggerDefinition,
  apis: [
    path.resolve(__dirname, '../routes/*.ts'),
    path.resolve(__dirname, '../models/*.ts')
  ]
};

// 生成Swagger规范
const swaggerSpec = swaggerJSDoc(options);

// 创建Swagger路由
export const setupSwagger = (app: any) => {
  const router = new Router();

  // 提供swagger.json接口
  router.get('/swagger.json', async (ctx: Context) => {
    ctx.set('Content-Type', 'application/json');
    ctx.body = swaggerSpec;
  });

  // 设置Swagger UI
  router.get(
    '/swagger',
    koaSwagger({
      routePrefix: false,
      swaggerOptions: {
        url: '/swagger.json'
      },
      title: '项目网站API文档',
      oauthOptions: {},
      hideTopbar: false
    })
  );

  app.use(router.routes()).use(router.allowedMethods());
};

export default setupSwagger;