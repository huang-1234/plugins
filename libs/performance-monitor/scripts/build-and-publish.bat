@echo off
setlocal enabledelayedexpansion

echo =========================================================
echo      Performance Monitor 构建与发布流程
echo =========================================================

REM 检查环境
echo [1/7] 检查环境...
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo 错误: pnpm 未安装
  echo 请运行: npm install -g pnpm
  exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo 错误: npm 未安装
  exit /b 1
)

REM 显示版本信息
echo Node.js 版本:
node -v
echo pnpm 版本:
pnpm -v
echo npm 版本:
npm -v

REM 获取当前版本
for /f "tokens=*" %%a in ('node -p "require('./package.json').version"') do set CURRENT_VERSION=%%a
echo 当前版本: %CURRENT_VERSION%

REM 清理旧的构建文件
echo [2/7] 清理旧的构建文件...
call pnpm run clean

REM 安装依赖
echo [3/7] 安装依赖...
call pnpm install

REM 运行测试
echo [4/7] 运行测试...
call pnpm test
if %ERRORLEVEL% NEQ 0 (
  echo 测试失败!
  set /p CONTINUE=是否继续构建? (y/n):
  if /i "!CONTINUE!" NEQ "y" exit /b 1
)

REM 构建库
echo [5/7] 使用pnpm构建库...
set NODE_ENV=production
call pnpm run build

REM 检查构建结果
if exist "dist" (
  echo 构建成功！
  echo 构建输出:
  dir dist
) else (
  echo 构建失败：dist 目录不存在
  exit /b 1
)

REM 创建临时目录进行发包测试
echo [6/7] 使用npm进行发包测试...
set TEMP_DIR=%TEMP%\performance-monitor-test-%RANDOM%
echo 创建临时目录: %TEMP_DIR%
mkdir "%TEMP_DIR%"

REM 复制package.json和dist目录到临时目录
copy package.json "%TEMP_DIR%\"
copy README.md "%TEMP_DIR%\"
xcopy /E /I dist "%TEMP_DIR%\dist"

REM 进入临时目录
pushd "%TEMP_DIR%"

REM 修改package.json，准备发布
node -e "const pkg = require('./package.json'); delete pkg.devDependencies; delete pkg.scripts; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));"

REM 使用npm pack创建tarball但不实际发布
echo 创建npm包...
call npm pack

REM 显示创建的包
for %%F in (*.tgz) do set PACKAGE_FILE=%%F
echo 成功创建测试包: %PACKAGE_FILE%

REM 验证包内容
echo 验证包内容:
tar -tzf "%PACKAGE_FILE%"

REM 返回原目录
popd

REM 询问是否要发布
echo [7/7] 准备发布...
set /p PUBLISH=是否要发布到npm? (y/n):
if /i "%PUBLISH%" NEQ "y" (
  echo 已取消发布。
  goto cleanup
)

REM 选择发布标签
echo 选择发布标签:
echo 1) latest (稳定版)
echo 2) beta (测试版)
echo 3) alpha (内测版)
echo 4) next (预览版)
set /p TAG_CHOICE=请选择 (1-4):

if "%TAG_CHOICE%"=="1" (
  set TAG=latest
) else if "%TAG_CHOICE%"=="2" (
  set TAG=beta
) else if "%TAG_CHOICE%"=="3" (
  set TAG=alpha
) else if "%TAG_CHOICE%"=="4" (
  set TAG=next
) else (
  echo 无效选择，使用默认标签 'latest'
  set TAG=latest
)

echo 使用标签: %TAG%

REM 发布到npm
echo 发布到npm...
call npm publish --tag %TAG%

if %ERRORLEVEL% EQU 0 (
  echo 发布成功!
  echo 版本 %CURRENT_VERSION% 已发布到npm (标签: %TAG%)
) else (
  echo 发布失败!
  exit /b 1
)

:cleanup
REM 清理临时目录
echo 清理临时文件...
rd /s /q "%TEMP_DIR%"

echo 构建与发布流程完成!
endlocal