import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

/**
 * 验证构建输出
 */
function verifyBuild() {
  console.log('验证构建输出...');

  // 检查dist目录是否存在
  if (!fs.existsSync(distDir)) {
    console.error('❌ 错误: dist目录不存在');
    process.exit(1);
  }

  // 需要验证的文件列表
  const requiredFiles = [
    'index.js',          // ESM模块
    'index.cjs',         // CommonJS模块
    'index.d.ts',        // 类型定义
    'performance-monitor.min.js', // UMD包
    'index.js.map',      // Source map
    'index.cjs.map'      // Source map
  ];

  // 验证所有必需文件
  let allFilesExist = true;

  for (const file of requiredFiles) {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      console.log(`✓ ${file} (${fileSizeKB} KB)`);
    } else {
      console.error(`❌ 错误: ${file} 不存在`);
      allFilesExist = false;
    }
  }

  // 验证ESM模块
  try {
    const esmModule = path.join(distDir, 'index.js');
    const esmContent = fs.readFileSync(esmModule, 'utf8');

    if (!esmContent.includes('export')) {
      console.error('❌ 错误: ESM模块没有导出');
      allFilesExist = false;
    }
  } catch (error) {
    console.error('❌ 错误: 无法读取ESM模块', error);
    allFilesExist = false;
  }

  // 验证类型定义
  try {
    const dtsFile = path.join(distDir, 'index.d.ts');
    const dtsContent = fs.readFileSync(dtsFile, 'utf8');

    if (!dtsContent.includes('export')) {
      console.error('❌ 错误: 类型定义文件没有导出');
      allFilesExist = false;
    }
  } catch (error) {
    console.error('❌ 错误: 无法读取类型定义文件', error);
    allFilesExist = false;
  }

  // 输出结果
  if (allFilesExist) {
    console.log('\n✅ 验证成功: 所有文件都存在且格式正确');
  } else {
    console.error('\n❌ 验证失败: 部分文件缺失或格式不正确');
    process.exit(1);
  }
}

verifyBuild();