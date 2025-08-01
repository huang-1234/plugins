@echo off
:: 构建和发布 files-buffer 包的批处理脚本

:: 获取当前目录
set CURRENT_DIR=%CD%

:: 检查是否在正确的目录中
if not exist "%CURRENT_DIR%\package.json" (
  echo 错误: 请在 files-buffer 包根目录中运行此脚本
  exit /b 1
)

:: 读取版本
for /f "tokens=*" %%a in ('node -p "require('./package.json').version"') do set VERSION=%%a
echo 当前版本: %VERSION%

:: 清理
echo 清理旧的构建文件...
if exist "%CURRENT_DIR%\dist" (
  rmdir /s /q "%CURRENT_DIR%\dist"
)

:: 安装依赖
echo 安装依赖...
call npm install

:: 运行测试
echo 运行测试...
call npm test

:: 构建
echo 构建包...
call npm run build

:: 检查构建结果
if not exist "%CURRENT_DIR%\dist" (
  echo 错误: 构建失败，没有生成 dist 目录
  exit /b 1
)

:: 检查是否有必要的文件
for %%f in (index.js index.cjs index.d.ts) do (
  if not exist "%CURRENT_DIR%\dist\%%f" (
    echo 错误: 构建后缺少必要文件 %%f
    exit /b 1
  )
)

:: 询问是否发布
set /p REPLY="是否发布到 npm? (y/n) "
if /i "%REPLY%"=="y" (
  echo 发布到 npm...
  call npm run publish-npm
  echo files-buffer@%VERSION% 已成功发布!
) else (
  echo 跳过发布步骤。
)

echo 构建完成!