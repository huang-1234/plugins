#!/usr/bin/env node

/**
 * Chrome Performance 扩展构建脚本
 *
 * 用法:
 *   node build.js [选项]
 *
 * 选项:
 *   --mode=production|development  构建模式 (默认: production)
 *   --skip-deps                    跳过依赖库构建
 *   --watch                        监视模式
 *   --zip                          创建ZIP包
 *   --install                      构建后自动安装到Chrome
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  mode: 'production',
  skipDeps: false,
  watch: false,
  zip: false,
  install: false
};

args.forEach(arg => {
  if (arg.startsWith('--mode=')) {
    options.mode = arg.split('=')[1];
  } else if (arg === '--skip-deps') {
    options.skipDeps = true;
  } else if (arg === '--watch') {
    options.watch = true;
  } else if (arg === '--zip') {
    options.zip = true;
  } else if (arg === '--install') {
    options.install = true;
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

// 获取包信息
const packageJson = require('./package.json');
const version = packageJson.version;
const extensionName = packageJson.name;

// 开始构建流程
logHeader(`开始构建 Chrome Performance 扩展 v${version} (${options.mode} 模式)`);

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
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}

// 安装依赖
logHeader('安装依赖');
run('npm install --ignore-scripts');

// 构建依赖库
if (!options.skipDeps) {
  logHeader('构建性能监控库依赖');

  // 保存当前目录
  const currentDir = process.cwd();

  // 切换到性能监控库目录
  process.chdir(path.join('..', 'libs', 'performance-monitor'));

  // 构建性能监控库
  run('npm install --ignore-scripts');
  run('npm run build');

  // 返回扩展目录
  process.chdir(currentDir);
} else {
  log('跳过依赖库构建', colors.yellow);
}

// 构建扩展
logHeader('构建Chrome扩展');
if (options.watch) {
  log('启动监视模式...', colors.yellow);
  run('npm run dev');
} else {
  const buildCmd = options.mode === 'development'
    ? 'npm run build:dev'
    : 'npm run build:extension';
  run(buildCmd);
}

// 检查构建结果
if (fs.existsSync('dist') && fs.readdirSync('dist').length > 0) {
  log('构建成功！', colors.green);

  // 显示构建输出文件
  log('构建输出:', colors.yellow);
  const distFiles = fs.readdirSync('dist');
  distFiles.forEach(file => {
    const stats = fs.statSync(path.join('dist', file));
    if (stats.isDirectory()) {
      log(`📁 ${file}/`, colors.cyan);
    } else {
      const sizeInKB = (stats.size / 1024).toFixed(2);
      log(`📄 ${file} (${sizeInKB} KB)`, colors.white);
    }
  });
} else {
  log('构建失败：dist 目录为空或不存在', colors.red);
  process.exit(1);
}

// 创建ZIP包
if (options.zip) {
  logHeader('创建ZIP包');

  const zipName = `memory-monitor-extension-v${version}.zip`;

  // 尝试使用不同方法创建ZIP
  let zipCreated = false;

  // 方法1: 使用Node.js的内置模块
  try {
    const archiver = require('archiver');
    const output = fs.createWriteStream(zipName);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      log(`ZIP包创建成功: ${zipName} (${(archive.pointer() / 1024).toFixed(2)} KB)`, colors.green);
    });

    archive.pipe(output);
    archive.directory('dist/', false);
    archive.finalize();

    zipCreated = true;
  } catch (error) {
    log(`使用archiver创建ZIP失败: ${error.message}`, colors.yellow);
  }

  // 方法2: 使用系统命令
  if (!zipCreated) {
    if (process.platform === 'win32') {
      // Windows: 使用PowerShell
      try {
        execSync(`powershell -Command "Compress-Archive -Path dist\\* -DestinationPath ${zipName} -Force"`);
        log(`ZIP包创建成功: ${zipName}`, colors.green);
        zipCreated = true;
      } catch (error) {
        log(`使用PowerShell创建ZIP失败: ${error.message}`, colors.yellow);
      }
    } else {
      // Linux/Mac: 使用zip命令
      try {
        execSync(`cd dist && zip -r "../${zipName}" * && cd ..`);
        log(`ZIP包创建成功: ${zipName}`, colors.green);
        zipCreated = true;
      } catch (error) {
        log(`使用zip命令创建ZIP失败: ${error.message}`, colors.yellow);
      }
    }
  }

  if (!zipCreated) {
    log('无法创建ZIP包，请手动压缩dist目录', colors.red);
  }
}

// 自动安装到Chrome
if (options.install) {
  logHeader('安装到Chrome');
  log('自动安装功能尚未实现。请手动安装扩展:', colors.yellow);
  log('1. 打开Chrome浏览器，访问 chrome://extensions/', colors.white);
  log('2. 启用"开发者模式"', colors.white);
  log('3. 点击"加载已解压的扩展程序"按钮', colors.white);
  log(`4. 选择 ${path.resolve('dist')} 目录`, colors.white);
}

// 构建完成
logHeader('构建完成');
log(`Chrome Performance 扩展 v${version} 构建完成!`, colors.green);
log(`构建输出位于: ${path.resolve('dist')}`, colors.green);

if (options.watch) {
  log('\n监视模式已启动，按 Ctrl+C 停止...', colors.yellow);
}