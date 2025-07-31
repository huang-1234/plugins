#!/usr/bin/env node

/**
 * PNPM安装依赖 + NPM发布包工作流
 *
 * 用法:
 *   node pnpm-build-npm-publish.js [选项]
 *
 * 选项:
 *   --tag=<标签>          发布标签 (latest, beta, alpha, next, rc)
 *   --skip-test           跳过测试
 *   --skip-build          跳过构建
 *   --dry-run             模拟发布流程但不实际发布
 *   --otp=<code>          提供OTP验证码 (双因素认证)
 *   --registry=<url>      指定npm注册表URL
 *   --create-git-tag      自动创建git标签
 *   --clean               发布前清理测试包
 *   --access=<public|restricted>  设置发布访问权限
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  tag: null,
  skipTest: false,
  skipBuild: false,
  dryRun: false,
  otp: null,
  registry: null,
  createGitTag: false,
  clean: false,
  access: null
};

args.forEach(arg => {
  if (arg.startsWith('--tag=')) options.tag = arg.split('=')[1];
  else if (arg === '--skip-test') options.skipTest = true;
  else if (arg === '--skip-build') options.skipBuild = true;
  else if (arg === '--dry-run') options.dryRun = true;
  else if (arg.startsWith('--otp=')) options.otp = arg.split('=')[1];
  else if (arg.startsWith('--registry=')) options.registry = arg.split('=')[1];
  else if (arg === '--create-git-tag') options.createGitTag = true;
  else if (arg === '--clean') options.clean = true;
  else if (arg.startsWith('--access=')) options.access = arg.split('=')[1];
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

  logHeader(`PNPM安装依赖 + NPM发布包工作流`);

  log(`包信息:`, colors.cyan);
  log(`名称: ${packageName}`, colors.yellow);
  log(`版本: ${version}`, colors.yellow);

  // 步骤1: 使用pnpm安装依赖并构建
  logHeader(`[步骤1] 使用pnpm安装依赖并构建`);

  log(`正在安装依赖...`, colors.cyan);
  run('pnpm install --ignore-scripts');

  if (!options.skipBuild) {
    log(`正在清理旧的构建文件...`, colors.cyan);
    try {
      // 尝试使用pnpm run clean，如果失败则直接删除dist目录
      const cleanResult = execSync('pnpm run clean', { stdio: 'pipe', encoding: 'utf-8' });
      log(cleanResult.trim(), colors.dim);
    } catch (error) {
      log(`清理命令失败，尝试手动删除dist目录...`, colors.yellow);
      if (fs.existsSync('dist')) {
        try {
          fs.rmSync('dist', { recursive: true, force: true });
          log(`手动删除dist目录成功`, colors.green);
        } catch (err) {
          log(`手动删除dist目录失败: ${err.message}`, colors.red);
          log(`继续执行...`, colors.yellow);
        }
      } else {
        log(`dist目录不存在，无需清理`, colors.dim);
      }
    }

        if (!options.skipTest) {
      log(`运行测试...`, colors.cyan);
      try {
        const testResult = execSync('pnpm run test', { stdio: 'pipe', encoding: 'utf-8' });
        log(testResult.trim(), colors.dim);
        log(`测试完成`, colors.green);
      } catch (error) {
        log(`测试失败或没有测试脚本`, colors.yellow);
        log(error.message, colors.dim);

        const answer = await ask('是否继续构建? (y/n): ');
        if (answer.toLowerCase() !== 'y') {
          log(`已取消构建`, colors.red);
          process.exit(1);
        }
      }
    } else {
      log(`跳过测试...`, colors.yellow);
    }

    log(`构建中...`, colors.cyan);
    run('pnpm run build');

    // 检查构建结果
    if (!fs.existsSync('dist') || fs.readdirSync('dist').length === 0) {
      log(`构建失败: dist目录为空或不存在`, colors.red);
      process.exit(1);
    }

    log(`构建成功!`, colors.green);
  } else {
    log(`跳过构建...`, colors.yellow);
  }

  // 步骤2: 使用npm进行发包测试
  logHeader(`[步骤2] 使用npm进行发包测试`);

  // 清理旧的测试包
  if (options.clean) {
    const oldPackages = fs.readdirSync('.').filter(file => file.startsWith(`${packageName}-`) && file.endsWith('.tgz'));
    if (oldPackages.length > 0) {
      log(`清理旧的测试包...`, colors.cyan);
      oldPackages.forEach(file => {
        fs.unlinkSync(file);
        log(`已删除: ${file}`, colors.dim);
      });
    }
  }

  run('npm pack --ignore-scripts');

  // 检查测试包
  const packageFiles = fs.readdirSync('.').filter(file => file.startsWith(`${packageName}-`) && file.endsWith('.tgz'));
  if (packageFiles.length === 0) {
    log(`发包测试失败: 未找到生成的测试包`, colors.red);
    process.exit(1);
  }

  const packageFile = packageFiles[0];
  log(`发包测试成功: ${packageFile}`, colors.green);

  // 步骤3: 选择发布标签
  let tag = options.tag;
  if (!tag) {
    logHeader(`[步骤3] 选择发布标签`);
    log(`1) latest - 稳定版本`, colors.white);
    log(`2) beta - 测试版本`, colors.white);
    log(`3) alpha - 内测版本`, colors.white);
    log(`4) next - 预览版本`, colors.white);
    log(`5) rc - 候选发布版本`, colors.white);
    log(`6) 自定义标签`, colors.white);

    const tagChoice = await ask('请选择 (默认: 1): ');

    switch (tagChoice) {
      case '': case '1': tag = 'latest'; break;
      case '2': tag = 'beta'; break;
      case '3': tag = 'alpha'; break;
      case '4': tag = 'next'; break;
      case '5': tag = 'rc'; break;
      case '6':
        tag = await ask('请输入自定义标签名: ');
        if (!tag) {
          log(`错误: 标签名不能为空`, colors.red);
          process.exit(1);
        }
        break;
      default:
        log(`无效选择，使用默认标签 "latest"`, colors.yellow);
        tag = 'latest';
    }
  }

  log(`使用标签: ${tag}`, colors.green);

  // 步骤4: 确认发布信息
  logHeader(`[步骤4] 确认发布信息`);
  log(`包名: ${packageName}`, colors.white);
  log(`版本: ${version}`, colors.white);
  log(`标签: ${tag}`, colors.white);

  // 检查npm登录状态
  log(`\n检查npm登录状态...`, colors.cyan);
  let npmUser;
  try {
    npmUser = execSync('npm whoami', { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (error) {
    log(`错误: 未登录npm`, colors.red);
    log(`请先运行: npm login`, colors.yellow);
    process.exit(1);
  }

  log(`已登录为: ${npmUser}`, colors.green);

  const confirm = await ask('是否确认发布到npm? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    log(`已取消发布`, colors.yellow);
    rl.close();
    return;
  }

  // 步骤5: 执行发布
  logHeader(`[步骤5] 执行发布`);

  // 构建发布命令
  let publishCommand = `npm publish --tag ${tag} --ignore-scripts`;

  if (options.dryRun) {
    publishCommand += ' --dry-run';
    log(`干运行模式 - 不会实际发布`, colors.yellow);
  }

  if (options.registry) {
    publishCommand += ` --registry=${options.registry}`;
  }

  if (options.otp) {
    publishCommand += ` --otp=${options.otp}`;
  }

  if (options.access) {
    publishCommand += ` --access=${options.access}`;
  }

  // 执行发布
  log(`正在发布到npm...`, colors.cyan);
  const publishResult = run(publishCommand, { ignoreError: true });

  if (publishResult !== null) {
    log(`\n✅ 发布成功!`, colors.green);
    log(`版本 ${version} 已发布到npm (标签: ${tag})`, colors.green);
    log(`可以通过以下命令安装:`, colors.white);
    log(`npm install ${packageName}@${tag}`, colors.cyan);

    // 清理测试包
    const cleanPackage = await ask(`是否删除测试包 ${packageFile}? (y/n): `);
    if (cleanPackage.toLowerCase() === 'y') {
      fs.unlinkSync(packageFile);
      log(`测试包已删除`, colors.green);
    }

    // 创建git标签
    if (options.createGitTag) {
      log(`\n创建git标签...`, colors.cyan);
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
    log(`\n❌ 发布失败!`, colors.red);
    process.exit(1);
  }

  logHeader(`PNPM安装依赖 + NPM发布包工作流完成!`);
  rl.close();
}

main().catch(error => {
  log(`错误: ${error.message}`, colors.red);
  process.exit(1);
});