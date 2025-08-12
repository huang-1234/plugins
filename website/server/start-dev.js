#!/usr/bin/env node

// 启动开发服务器脚本
const { spawn } = require('child_process');
const path = require('path');

// 使用ts-node运行TypeScript代码
const tsNode = path.resolve(__dirname, 'node_modules/.bin/ts-node');
const entryFile = path.resolve(__dirname, 'src/index.ts');

console.log('启动开发服务器...');
console.log(`执行: ${tsNode} ${entryFile}`);

// 启动进程
const child = spawn(tsNode, [entryFile], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' }
});

// 监听退出事件
child.on('close', (code) => {
  console.log(`进程退出，退出码: ${code}`);
});

// 处理信号
process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});