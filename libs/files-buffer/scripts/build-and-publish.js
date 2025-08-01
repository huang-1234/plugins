#!/usr/bin/env node

/**
 * 构建和发布 files-buffer 包的脚本
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 获取当前目录
const currentDir = process.cwd();
const packageJsonPath = path.join(currentDir, 'package.json');

// 检查是否在正确的目录中
if (!fs.existsSync(packageJsonPath)) {
  console.error('错误: 请在 files-buffer 包根目录中运行此脚本');
  process.exit(1);
}

// 读取 package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// 显示当前版本
console.log(`当前版本: ${packageJson.version}`);

// 执行命令并打印输出
function runCommand(command) {
  console.log(`执行: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`命令执行失败: ${command}`);
    process.exit(1);
  }
}

// 清理
console.log('清理旧的构建文件...');
if (fs.existsSync(path.join(currentDir, 'dist'))) {
  fs.rmSync(path.join(currentDir, 'dist'), { recursive: true, force: true });
}

// 安装依赖
console.log('安装依赖...');
runCommand('npm install');

// 运行测试
console.log('运行测试...');
runCommand('npm test');

// 构建
console.log('构建包...');
runCommand('npm run build');

// 检查构建结果
const distDir = path.join(currentDir, 'dist');
if (!fs.existsSync(distDir)) {
  console.error('错误: 构建失败，没有生成 dist 目录');
  process.exit(1);
}

// 检查是否有必要的文件
const requiredFiles = ['index.js', 'index.cjs', 'index.d.ts'];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(distDir, file))) {
    console.error(`错误: 构建后缺少必要文件 ${file}`);
    process.exit(1);
  }
}

// 询问是否发布
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('是否发布到 npm? (y/n) ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    console.log('发布到 npm...');
    runCommand('npm run publish-npm');
    console.log(`files-buffer@${packageJson.version} 已成功发布!`);
  } else {
    console.log('跳过发布步骤。');
  }

  console.log('构建完成!');
  readline.close();
});