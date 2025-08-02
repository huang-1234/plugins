import Router from 'koa-router';
import fs from 'fs';
import path from 'path';

const router = new Router();

// MDX文档服务
router.get('/:name', async (ctx) => {
  const { name } = ctx.params;
  const docPath = path.resolve(__dirname, `../../content/${name}.mdx`);

  try {
    // 检查文件是否存在
    if (fs.existsSync(docPath)) {
      ctx.type = 'text/markdown';
      ctx.body = fs.createReadStream(docPath);
    } else {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: `文档 ${name}.mdx 不存在`
      };
    }
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `读取文档失败: ${error.message}`
    };
  }
});

// 获取文档列表
router.get('/', async (ctx) => {
  const contentDir = path.resolve(__dirname, '../../content');

  try {
    // 确保目录存在
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    const files = fs.readdirSync(contentDir)
      .filter(file => file.endsWith('.mdx') || file.endsWith('.md'))
      .map(file => ({
        name: path.basename(file, path.extname(file)),
        path: file,
        lastModified: fs.statSync(path.join(contentDir, file)).mtime
      }));

    ctx.body = {
      success: true,
      data: files
    };
  } catch (error: any) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `获取文档列表失败: ${error.message}`
    };
  }
});

export const docRoutes = router;