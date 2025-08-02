import Router from 'koa-router';
import fs from 'fs';
import path from 'path';

const router = new Router();

/**
 * @swagger
 * /{name}:
 *   get:
 *     summary: 获取指定文档
 *     description: 获取指定名称的Markdown文档
 *     tags: [文档]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: 文档名称
 *     responses:
 *       200:
 *         description: 成功返回文档内容
 *         content:
 *           text/markdown:
 *             schema:
 *               type: string
 *       404:
 *         description: 文档不存在
 *       500:
 *         description: 服务器错误
 */
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

/**
 * @swagger
 * /:
 *   get:
 *     summary: 获取文档列表
 *     description: 获取所有可用的Markdown文档列表
 *     tags: [文档]
 *     responses:
 *       200:
 *         description: 成功返回文档列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       path:
 *                         type: string
 *                       lastModified:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: 服务器错误
 */
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