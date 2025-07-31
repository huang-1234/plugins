import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

async function prepareExtension() {
  try {
    console.log('准备Chrome扩展...');

    // 确保目标目录存在
    await fs.ensureDir(distDir);

    // 复制manifest.json到dist目录
    await fs.copy(
      path.join(rootDir, 'manifest.json'),
      path.join(distDir, 'manifest.json')
    );
    console.log('✅ 复制manifest.json');

    // 复制public目录下的文件到dist目录
    await fs.copy(publicDir, path.join(distDir, 'public'));
    console.log('✅ 复制public目录');

    // 复制背景脚本和内容脚本
    await fs.copy(
      path.join(rootDir, 'src/background.ts'),
      path.join(distDir, 'background.js')
    );
    console.log('✅ 复制background.js');

    await fs.copy(
      path.join(rootDir, 'src/contentScript.ts'),
      path.join(distDir, 'contentScript.js')
    );
    console.log('✅ 复制contentScript.js');

    console.log('Chrome扩展准备完成！');
  } catch (error) {
    console.error('准备扩展时出错:', error);
    process.exit(1);
  }
}

prepareExtension();