@echo off
setlocal enabledelayedexpansion

echo ========================================
echo         NPM 发布脚本 (Windows)
echo ========================================

REM 获取包信息
for /f "tokens=*" %%a in ('node -p "require('./package.json').name"') do set PACKAGE_NAME=%%a
for /f "tokens=*" %%a in ('node -p "require('./package.json').version"') do set VERSION=%%a

echo 准备发布 %PACKAGE_NAME% v%VERSION% 到 NPM

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

REM 选择发布标签
echo.
echo 选择发布标签:
echo 1) latest - 稳定版本
echo 2) beta - 测试版本
echo 3) alpha - 内测版本
echo 4) next - 预览版本
echo 5) 自定义标签

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

REM 确认发布前的准备工作
echo.
echo 发布前准备:
echo 1) 仅发布 (假设已构建)
echo 2) 构建并发布
echo 3) 测试、构建并发布

set /p BUILD_CHOICE=请选择 (默认: 2):
echo.

if "%BUILD_CHOICE%"=="" set BUILD_CHOICE=2

if "%BUILD_CHOICE%"=="1" (
  echo 跳过构建步骤...
) else if "%BUILD_CHOICE%"=="2" (
  echo 构建中...
  call npm run build
  if %ERRORLEVEL% NEQ 0 (
    echo 构建失败!
    exit /b 1
  )
) else if "%BUILD_CHOICE%"=="3" (
  echo 测试中...
  call npm test
  if %ERRORLEVEL% NEQ 0 (
    echo 测试失败!
    set /p CONTINUE=是否继续发布? (y/n):
    if /i "!CONTINUE!" NEQ "y" exit /b 1
  )

  echo 构建中...
  call npm run build
  if %ERRORLEVEL% NEQ 0 (
    echo 构建失败!
    exit /b 1
  )
) else (
  echo 无效选择，使用默认选项 '构建并发布'
  call npm run build
  if %ERRORLEVEL% NEQ 0 (
    echo 构建失败!
    exit /b 1
  )
)

REM 确认发布信息
echo.
echo 发布信息确认:
echo 包名: %PACKAGE_NAME%
echo 版本: %VERSION%
echo 标签: %TAG%
echo 发布者: %NPM_USER%

set /p CONFIRM=确认发布? (y/n):
if /i "%CONFIRM%" NEQ "y" (
  echo 已取消发布
  exit /b 0
)

REM 执行发布
echo.
echo 正在发布到npm...
call npm publish --tag %TAG%

REM 检查发布结果
if %ERRORLEVEL% EQU 0 (
  echo.
  echo ✅ 发布成功!
  echo 包已发布: %PACKAGE_NAME%@%VERSION% (标签: %TAG%)
  echo 可通过以下命令安装:
  echo npm install %PACKAGE_NAME%@%TAG%

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

endlocal