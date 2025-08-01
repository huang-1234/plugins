@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo      PNPM安装依赖 + NPM发布包工作流 (Windows)
echo ========================================================

REM 获取包信息
for /f "tokens=*" %%a in ('node -p "require('./package.json').name"') do set PACKAGE_NAME=%%a
for /f "tokens=*" %%a in ('node -p "require('./package.json').version"') do set VERSION=%%a

echo.
echo 包信息:
echo 名称: %PACKAGE_NAME%
echo 版本: %VERSION%

REM 步骤1: 使用pnpm安装依赖并构建
echo.
echo [步骤1] 使用pnpm安装依赖并构建
echo 正在安装依赖...
call pnpm install --ignore-scripts

echo 正在清理旧的构建文件...
call pnpm run clean 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo 清理命令失败，尝试手动删除dist目录...
  if exist "dist" (
    rd /s /q dist
    echo 手动删除dist目录成功
  ) else (
    echo dist目录不存在，无需清理
  )
)

echo 运行测试...
call pnpm run test >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo 测试失败或没有测试脚本
  set /p CONTINUE=是否继续构建? (y/n):
  if /i "!CONTINUE!" NEQ "y" (
    echo 已取消构建
    exit /b 1
  )
) else (
  echo 测试完成
)

echo 构建中...
call pnpm run build

REM 检查构建结果
if not exist "dist" (
  echo 构建失败: dist目录不存在
  exit /b 1
)

dir /b dist 2>nul | findstr "." >nul
if %ERRORLEVEL% NEQ 0 (
  echo 构建失败: dist目录为空
  exit /b 1
)

echo 构建成功!

REM 步骤2: 使用npm进行发包测试
echo.
echo [步骤2] 使用npm进行发包测试
call npm pack --ignore-scripts

REM 检查测试包
for /f "tokens=*" %%a in ('dir /b %PACKAGE_NAME%-*.tgz 2^>nul') do set PACKAGE_FILE=%%a
if "%PACKAGE_FILE%"=="" (
  echo 发包测试失败: 未找到生成的测试包
  exit /b 1
)

echo 发包测试成功: %PACKAGE_FILE%

REM 步骤3: 选择发布标签
echo.
echo [步骤3] 选择发布标签
echo 1) latest - 稳定版本
echo 2) beta - 测试版本
echo 3) alpha - 内测版本
echo 4) next - 预览版本
echo 5) rc - 候选发布版本
echo 6) 自定义标签

set /p TAG_CHOICE=请选择 (默认: 1):
echo.

if "%TAG_CHOICE%"=="" set TAG_CHOICE=1

if "%TAG_CHOICE%"=="1" (
  set TAG=latest
) else if "%TAG_CHOICE%"=="2" (
  set TAG=beta
) else if "%TAG_CHOICE%"=="3" (
  set TAG=alpha
) else if "%TAG_CHOICE%"=="4" (
  set TAG=next
) else if "%TAG_CHOICE%"=="5" (
  set TAG=rc
) else if "%TAG_CHOICE%"=="6" (
  set /p TAG=请输入自定义标签名:
  if "!TAG!"=="" (
    echo 错误: 标签名不能为空
    exit /b 1
  )
) else (
  echo 无效选择，使用默认标签 'latest'
  set TAG=latest
)

echo 使用标签: %TAG%

REM 步骤4: 确认发布信息
echo.
echo [步骤4] 确认发布信息
echo 包名: %PACKAGE_NAME%
echo 版本: %VERSION%
echo 标签: %TAG%

REM 检查npm登录状态
echo.
echo 检查npm登录状态...
for /f "tokens=*" %%a in ('npm whoami 2^>nul') do set NPM_USER=%%a

if "%NPM_USER%"=="" (
  echo 错误: 未登录npm
  echo 请先运行: npm login
  exit /b 1
)

echo 已登录为: %NPM_USER%

REM 确认发布
set /p CONFIRM=是否确认发布到npm? (y/n):
if /i "%CONFIRM%" NEQ "y" (
  echo 已取消发布
  exit /b 0
)

REM 步骤5: 执行发布
echo.
echo [步骤5] 执行发布
echo 正在发布到npm...

REM 选择发布方式
echo 选择发布方式:
echo 1) 标准发布
echo 2) 带OTP验证码发布 (双因素认证)
echo 3) 干运行模式 (不实际发布)

set /p PUBLISH_MODE=请选择 (默认: 1):
echo.

set PUBLISH_CMD=npm publish --tag %TAG% --ignore-scripts

if "%PUBLISH_MODE%"=="2" (
  set /p OTP_CODE=请输入OTP验证码:
  set PUBLISH_CMD=%PUBLISH_CMD% --otp=%OTP_CODE%
) else if "%PUBLISH_MODE%"=="3" (
  set PUBLISH_CMD=%PUBLISH_CMD% --dry-run
  echo 干运行模式 - 不会实际发布
)

REM 执行发布命令
%PUBLISH_CMD%

REM 检查发布结果
if %ERRORLEVEL% EQU 0 (
  echo.
  echo ✅ 发布成功!
  echo 版本 %VERSION% 已发布到npm (标签: %TAG%)
  echo 可以通过以下命令安装:
  echo npm install %PACKAGE_NAME%@%TAG%

  REM 清理测试包
  set /p DELETE_PACKAGE=是否删除测试包 %PACKAGE_FILE%? (y/n):
  if /i "!DELETE_PACKAGE!"=="y" (
    del /f "%PACKAGE_FILE%"
    echo 测试包已删除
  )

  REM 创建git标签
  set /p CREATE_TAG=是否创建git标签 v%VERSION%? (y/n):
  if /i "!CREATE_TAG!"=="y" (
    git tag -a "v%VERSION%" -m "Release %VERSION%"
    git push origin "v%VERSION%"
    echo Git标签已创建并推送: v%VERSION%
  )
) else (
  echo.
  echo ❌ 发布失败!
  exit /b 1
)

echo.
echo PNPM安装依赖 + NPM发布包工作流完成!
endlocal