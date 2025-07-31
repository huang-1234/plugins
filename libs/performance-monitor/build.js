#!/usr/bin/env node

/**
 * performance-monitor 高级构建脚本
 *
 * 用法:
 *   node build.js [选项]
 *
 * 选项:
 *   --mode=production|development  构建模式 (默认: production)
 *   --skip-tests                  跳过测试
 *   --watch                       监视模式
 *   --analyze                     分析包大小
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  mode: 'production',
  skipTests: false,
  watch: false,
  analyze: false
};

args.forEach(arg => {
  if (arg.startsWith('--mode=')) {
    options.mode = arg.split('=')[1];
  } else if (arg === '--skip-tests') {
    options.skipTests = true;
  } else if (arg === '--watch') {
    options.watch = true;
  } else if (arg === '--analyze') {
    options.analyze = true;
  }
});

// 设置颜色
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// 辅助函数
function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(50));
  log(message, colors.cyan + colors.bright);
  console.log('='.repeat(50) + '\n');
}

function run(command, options = {}) {
  try {
    log(`执行: ${command}`, colors.dim);
    execSync(command, {
      stdio: 'inherit',
      ...options
    });
    return true;
  } catch (error) {
    if (options.ignoreError) {
      log(`命令执行失败，但继续执行: ${command}`, colors.yellow);
      return false;
    }
    log(`命令执行失败: ${command}`, colors.red);
    log(error.message, colors.red);
    process.exit(1);
  }
}

// 开始构建流程
logHeader(`开始构建 performance-monitor (${options.mode} 模式)`);

// 检查环境
log('检查环境...', colors.yellow);
try {
  const nodeVersion = execSync('node -v').toString().trim();
  const npmVersion = execSync('npm -v').toString().trim();

  log(`Node.js 版本: ${nodeVersion}`, colors.green);
  log(`npm 版本: ${npmVersion}`, colors.green);
} catch (error) {
  log('无法检测 Node.js 或 npm 版本', colors.red);
  process.exit(1);
}

// 清理旧的构建文件
logHeader('清理旧的构建文件');
run('npm run clean');

// 安装依赖
logHeader('安装依赖');
run('npm install');

// 运行测试
if (!options.skipTests) {
  logHeader('运行测试');
  run('npm test', { ignoreError: true });
} else {
  log('跳过测试', colors.yellow);
}

// 构建库
logHeader('构建库');
const buildCommand = options.watch
  ? 'npm run dev'
  : `cross-env NODE_ENV=${options.mode} npm run build`;

run(buildCommand);

// 分析包大小
if (options.analyze) {
  logHeader('分析包大小');
  const distPath = path.join(__dirname, 'dist');

  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);

    log('包大小分析:', colors.cyan);
    files.forEach(file => {
      const filePath = path.join(distPath, file);
      const stats = fs.statSync(filePath);
      const sizeInKB = (stats.size / 1024).toFixed(2);
      log(`${file}: ${sizeInKB} KB`, colors.white);
    });
  }
}

// 构建完成
logHeader('构建完成');
log(`构建输出位于: ${path.join(__dirname, 'dist')}`, colors.green);
log('使用说明:', colors.yellow);
log('  - ESM:  import { PerformanceMonitor } from \'performance-monitor\';');
log('  - CommonJS: const { PerformanceMonitor } = require(\'performance-monitor\');');
log('  - 浏览器: <script src="performance-monitor.min.js"></script>');

if (options.watch) {
  log('\n监视模式已启动，按 Ctrl+C 停止...', colors.yellow);
}