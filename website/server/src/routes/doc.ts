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
  const docPath = path.resolve(__dirname, `../db/docs/${name}.md`);

  try {
    // 检查文件是否存在
    console.log('name', name, docPath)
    if (fs.existsSync(docPath)) {
      ctx.type = 'text/markdown';
      ctx.body = fs.createReadStream(docPath);
    } else {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: `文档 ${name}.md 不存在`
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
 * /list:
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
 *               type: array
 *               items:
 *                 type: string
 *       500:
 *         description: 服务器错误
 */
// 读取 db/docs 目录下的所有 md 文件
router.get('/list', async (ctx) => {
  const docPath = path.resolve(__dirname, `../db/docs`);
  try {
    const files = fs.readdirSync(docPath);
    ctx.body = {
      success: true,
      data: files
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `读取文档列表失败: ${error}`
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
  // 尝试从两个目录获取文档
  const contentDir = path.resolve(__dirname, '../../content');
  const docsDir = path.resolve(__dirname, '../db/docs');

  try {
    let files: any[] = [];

    // 尝试读取 content 目录
    if (fs.existsSync(contentDir)) {
      const contentFiles = fs.readdirSync(contentDir)
        .filter(file => file.endsWith('.mdx') || file.endsWith('.md'))
        .map(file => ({
          name: path.basename(file, path.extname(file)),
          path: file,
          lastModified: fs.statSync(path.join(contentDir, file)).mtime
        }));
      files = [...files, ...contentFiles];
    }

    // 尝试读取 db/docs 目录
    if (fs.existsSync(docsDir)) {
      const docsFiles = fs.readdirSync(docsDir)
        .filter(file => file.endsWith('.mdx') || file.endsWith('.md'))
        .map(file => ({
          name: path.basename(file, path.extname(file)),
          path: file,
          lastModified: fs.statSync(path.join(docsDir, file)).mtime
        }));
      console.log('docsFiles', docsFiles)
      files = [...files, ...docsFiles];
    }

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