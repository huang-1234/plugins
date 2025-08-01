#!/usr/bin/env node

/**
 * NPM发布脚本
 *
 * 用法:
 *   node publish.js [选项]
 *
 * 选项:
 *   --tag=<标签>          发布标签 (latest, beta, alpha, next)
 *   --skip-build          跳过构建步骤
 *   --skip-test           跳过测试
 *   --dry-run             模拟发布流程但不实际发布
 *   --otp=<code>          提供OTP验证码 (双因素认证)
 *   --registry=<url>      指定npm注册表URL
 *   --create-git-tag      自动创建git标签
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  tag: null,
  skipBuild: false,
  skipTest: false,
  dryRun: false,
  otp: null,
  registry: null,
  createGitTag: false
};

args.forEach(arg => {
  if (arg.startsWith('--tag=')) options.tag = arg.split('=')[1];
  else if (arg === '--skip-build') options.skipBuild = true;
  else if (arg === '--skip-test') options.skipTest = true;
  else if (arg === '--dry-run') options.dryRun = true;
  else if (arg.startsWith('--otp=')) options.otp = arg.split('=')[1];
  else if (arg.startsWith('--registry=')) options.registry = arg.split('=')[1];
  else if (arg === '--create-git-tag') options.createGitTag = true;
});

// 设置颜色
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
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
    return execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
      ...options
    });
  } catch (error) {
    if (options.ignoreError) {
      log(`命令执行失败，但继续执行: ${command}`, colors.yellow);
      return null;
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
  // 获取包信息
  const packageJson = require(path.join(process.cwd(), 'package.json'));
  const packageName = packageJson.name;
  const version = packageJson.version;

  logHeader(`发布 ${packageName} v${version} 到 NPM`);

  // 检查npm登录状态
  log('检查npm登录状态...', colors.yellow);

  let npmUser;
  try {
    npmUser = execSync('npm whoami', { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (error) {
    log('错误: 未登录npm', colors.red);
    log('请先运行: npm login', colors.yellow);
    process.exit(1);
  }

  log(`已登录为: ${npmUser}`, colors.green);

  // 选择发布标签
  let tag = options.tag;
  if (!tag) {
    log('\n选择发布标签:', colors.yellow);
    log('1) latest - 稳定版本', colors.white);
    log('2) beta - 测试版本', colors.white);
    log('3) alpha - 内测版本', colors.white);
    log('4) next - 预览版本', colors.white);
    log('5) 自定义标签', colors.white);

    const tagChoice = await ask('请选择 (默认: 1): ');

    switch (tagChoice) {
      case '': case '1': tag = 'latest'; break;
      case '2': tag = 'beta'; break;
      case '3': tag = 'alpha'; break;
      case '4': tag = 'next'; break;
      case '5':
        tag = await ask('请输入自定义标签名: ');
        if (!tag) {
          log('错误: 标签名不能为空', colors.red);
          process.exit(1);
        }
        break;
      default:
        log('无效选择，使用默认标签 "latest"', colors.yellow);
        tag = 'latest';
    }
  }

  log(`使用标签: ${tag}`, colors.green);

  // 准备工作
  if (!options.skipTest && !options.skipBuild) {
    log('\n运行测试...', colors.yellow);
    const testSuccess = run('npm test', { ignoreError: true });

    if (!testSuccess) {
      const answer = await ask('测试失败! 是否继续? (y/n): ');
      if (answer.toLowerCase() !== 'y') {
        process.exit(1);
      }
    }
  } else if (options.skipTest) {
    log('\n跳过测试...', colors.yellow);
  }

  if (!options.skipBuild) {
    log('\n构建中...', colors.yellow);
    run('npm run build');
  } else {
    log('\n跳过构建...', colors.yellow);
  }

  // 检查dist目录
  if (!fs.existsSync('dist') || fs.readdirSync('dist').length === 0) {
    log('警告: dist目录为空或不存在', colors.yellow);
    const answer = await ask('是否继续发布? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      process.exit(1);
    }
  }

  // 确认发布信息
  log('\n发布信息确认:', colors.yellow);
  log(`包名: ${packageName}`, colors.white);
  log(`版本: ${version}`, colors.white);
  log(`标签: ${tag}`, colors.white);
  log(`发布者: ${npmUser}`, colors.white);
  log(`模拟模式: ${options.dryRun ? '是' : '否'}`, colors.white);

  const confirm = await ask('确认发布? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    log('已取消发布', colors.yellow);
    rl.close();
    return;
  }

  // 构建发布命令
  let publishCommand = `npm publish --tag ${tag}`;

  if (options.dryRun) {
    publishCommand += ' --dry-run';
  }

  if (options.registry) {
    publishCommand += ` --registry=${options.registry}`;
  }

  if (options.otp) {
    publishCommand += ` --otp=${options.otp}`;
  }

  // 执行发布
  log('\n正在发布到npm...', colors.yellow);
  const publishResult = run(publishCommand, { ignoreError: true });

  if (publishResult !== null) {
    log('\n✅ 发布成功!', colors.green);
    log(`包已发布: ${packageName}@${version} (标签: ${tag})`, colors.green);
    log('可通过以下命令安装:', colors.white);
    log(`npm install ${packageName}@${tag}`, colors.cyan);

    // 创建git标签
    if (options.createGitTag) {
      log('\n创建git标签...', colors.yellow);
      run(`git tag -a "v${version}" -m "Release ${version}"`, { ignoreError: true });
      run(`git push origin "v${version}"`, { ignoreError: true });
      log(`Git标签已创建并推送: v${version}`, colors.green);
    } else {
      const createTag = await ask('是否创建git标签 v' + version + '? (y/n): ');
      if (createTag.toLowerCase() === 'y') {
        run(`git tag -a "v${version}" -m "Release ${version}"`, { ignoreError: true });
        run(`git push origin "v${version}"`, { ignoreError: true });
        log(`Git标签已创建并推送: v${version}`, colors.green);
      }
    }
  } else {
    log('\n❌ 发布失败!', colors.red);
    process.exit(1);
  }

  rl.close();
}

main().catch(error => {
  log(`错误: ${error.message}`, colors.red);
  process.exit(1);
});