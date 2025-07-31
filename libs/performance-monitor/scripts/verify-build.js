import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

// 检查构建输出文件
function checkBuildOutput() {
  console.log('验证构建输出...');

  const requiredFiles = [
    'index.mjs',
    'index.cjs',
    'index.d.ts',
    'performance-monitor.min.js',
  ];

  const missingFiles = [];

  for (const file of requiredFiles) {
    const filePath = path.join(distPath, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    console.error('❌ 构建验证失败！以下文件缺失:');
    missingFiles.forEach(file => console.error(`  - ${file}`));
    process.exit(1);
  }

  // 检查文件大小
  const stats = {};
  for (const file of requiredFiles) {
    const filePath = path.join(distPath, file);
    if (fs.existsSync(filePath)) {
      const size = fs.statSync(filePath).size;
      const sizeKB = (size / 1024).toFixed(2);
      stats[file] = `${sizeKB} KB`;
    }
  }

  console.log('✅ 构建验证成功！');
  console.log('📊 构建输出统计:');
  for (const [file, size] of Object.entries(stats)) {
    console.log(`  - ${file}: ${size}`);
  }
}

// 执行验证
checkBuildOutput();