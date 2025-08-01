#!/usr/bin/env node

/**
 * Performance Monitor 构建与发布脚本
 *
 * 用法:
 *   node scripts/build-and-publish.js [选项]
 *
 * 选项:
 *   --skip-tests         跳过测试
 *   --skip-build         跳过构建 (仅发布已有的构建)
 *   --tag=<tag>          指定发布标签 (latest, beta, alpha, next)
 *   --dry-run            测试发布流程但不实际发布
 *   --use-npm            使用npm而不是pnpm进行构建
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  skipTests: false,
  skipBuild: false,
  tag: null,
  dryRun: false,
  useNpm: false
};

args.forEach(arg => {
  if (arg === '--skip-tests') options.skipTests = true;
  else if (arg === '--skip-build') options.skipBuild = true;
  else if (arg.startsWith('--tag=')) options.tag = arg.split('=')[1];
  else if (arg === '--dry-run') options.dryRun = true;
  else if (arg === '--use-npm') options.useNpm = true;
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
  log(message, colors.blue + colors.bright);
  console.log('='.repeat(50) + '\n');
}

function run(command, options = {}) {
  try {
    log(`执行: ${command}`, colors.dim);
    execSync(command, {
      stdio: options.silent ? 'ignore' : 'inherit',
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

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 询问函数
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// 主流程
async function main() {
  logHeader('Performance Monitor 构建与发布流程');

  // 检查环境
  log('[1/7] 检查环境...', colors.yellow);

  const packageManager = options.useNpm ? 'npm' : 'pnpm';

  try {
    const nodeVersion = execSync('node -v').toString().trim();
    const pmVersion = execSync(`${packageManager} -v`).toString().trim();

    log(`Node.js 版本: ${nodeVersion}`, colors.green);
    log(`${packageManager} 版本: ${pmVersion}`, colors.green);
  } catch (error) {
    log(`错误: ${packageManager} 未安装或无法运行`, colors.red);
    process.exit(1);
  }

  // 获取当前版本
  const packageJson = require(path.join(process.cwd(), 'package.json'));
  const currentVersion = packageJson.version;
  log(`当前版本: ${currentVersion}`, colors.green);

  // 清理旧的构建文件
  if (!options.skipBuild) {
    log('\n[2/7] 清理旧的构建文件...', colors.yellow);
    run(`${packageManager} run clean`);
  } else {
    log('\n[2/7] 跳过清理 (--skip-build)', colors.yellow);
  }

  // 安装依赖
  if (!options.skipBuild) {
    log('\n[3/7] 安装依赖...', colors.yellow);
    run(`${packageManager} install`);
  } else {
    log('\n[3/7] 跳过安装依赖 (--skip-build)', colors.yellow);
  }

  // 运行测试
  if (!options.skipTests && !options.skipBuild) {
    log('\n[4/7] 运行测试...', colors.yellow);
    const testSuccess = run(`${packageManager} test`, { ignoreError: true });

    if (!testSuccess) {
      const answer = await ask('测试失败! 是否继续构建? (y/n): ');
      if (answer.toLowerCase() !== 'y') {
        process.exit(1);
      }
    }
  } else {
    log('\n[4/7] 跳过测试 (--skip-tests 或 --skip-build)', colors.yellow);
  }

  // 构建库
  if (!options.skipBuild) {
    log('\n[5/7] 构建库...', colors.yellow);
    run(`cross-env NODE_ENV=production ${packageManager} run build`);

    // 检查构建结果
    if (!fs.existsSync('dist') || fs.readdirSync('dist').length === 0) {
      log('构建失败：dist 目录为空或不存在', colors.red);
      process.exit(1);
    }

    log('构建成功!', colors.green);
    log('构建输出:', colors.yellow);
    fs.readdirSync('dist').forEach(file => {
      const stats = fs.statSync(path.join('dist', file));
      const sizeInKB = (stats.size / 1024).toFixed(2);
      log(`- ${file} (${sizeInKB} KB)`, colors.white);
    });
  } else {
    log('\n[5/7] 跳过构建 (--skip-build)', colors.yellow);

    // 检查dist目录是否存在
    if (!fs.existsSync('dist') || fs.readdirSync('dist').length === 0) {
      log('错误: dist 目录为空或不存在，无法继续发布', colors.red);
      process.exit(1);
    }
  }

  // 创建临时目录进行发包测试
  log('\n[6/7] 进行发包测试...', colors.yellow);

  const tempDir = path.join(os.tmpdir(), `performance-monitor-test-${Date.now()}`);
  log(`创建临时目录: ${tempDir}`, colors.dim);

  fs.mkdirSync(tempDir, { recursive: true });
  fs.copyFileSync('package.json', path.join(tempDir, 'package.json'));
  fs.copyFileSync('README.md', path.join(tempDir, 'README.md'));

  // 复制dist目录
  fs.mkdirSync(path.join(tempDir, 'dist'), { recursive: true });
  fs.readdirSync('dist').forEach(file => {
    fs.copyFileSync(
      path.join('dist', file),
      path.join(tempDir, 'dist', file)
    );
  });

  // 修改package.json，准备发布
  const tempPackageJson = require(path.join(tempDir, 'package.json'));
  delete tempPackageJson.devDependencies;
  delete tempPackageJson.scripts;

  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify(tempPackageJson, null, 2)
  );

  // 使用npm pack创建tarball但不实际发布
  process.chdir(tempDir);
  log('创建npm包...', colors.dim);
  run('npm pack', { silent: true });

  // 显示创建的包
  const packageFile = fs.readdirSync('.').find(file => file.endsWith('.tgz'));
  log(`成功创建测试包: ${packageFile}`, colors.green);

  // 验证包内容
  log('验证包内容:', colors.yellow);
  run(`tar -tzf "${packageFile}"`, { ignoreError: true });

  // 返回原目录
  process.chdir(process.cwd());

  // 询问是否要发布
  log('\n[7/7] 准备发布...', colors.yellow);

  if (!options.tag) {
    log('选择发布标签:', colors.white);
    log('1) latest (稳定版)', colors.white);
    log('2) beta (测试版)', colors.white);
    log('3) alpha (内测版)', colors.white);
    log('4) next (预览版)', colors.white);

    const tagChoice = await ask('请选择 (1-4): ');

    switch (tagChoice) {
      case '1': options.tag = 'latest'; break;
      case '2': options.tag = 'beta'; break;
      case '3': options.tag = 'alpha'; break;
      case '4': options.tag = 'next'; break;
      default:
        log('无效选择，使用默认标签 "latest"', colors.yellow);
        options.tag = 'latest';
    }
  }

  log(`使用标签: ${options.tag}`, colors.green);

  if (!options.dryRun) {
    const publishConfirm = await ask('是否要发布到npm? (y/n): ');

    if (publishConfirm.toLowerCase() === 'y') {
      // 发布到npm
      log('发布到npm...', colors.yellow);
      run(`npm publish --tag ${options.tag}`);

      log('发布成功!', colors.green);
      log(`版本 ${currentVersion} 已发布到npm (标签: ${options.tag})`, colors.green);
    } else {
      log('已取消发布。', colors.yellow);
    }
  } else {
    log('模拟发布模式 (--dry-run)，跳过实际发布', colors.yellow);
    log(`将使用以下命令发布: npm publish --tag ${options.tag}`, colors.dim);
  }

  // 清理临时目录
  log('\n清理临时文件...', colors.dim);
  fs.rmSync(tempDir, { recursive: true, force: true });

  log('\n构建与发布流程完成!', colors.green);
  rl.close();
}

main().catch(error => {
  log(`错误: ${error.message}`, colors.red);
  process.exit(1);
});