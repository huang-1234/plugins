@echo off
echo 开始构建 performance-monitor 包...

REM 检查环境
echo 检查环境...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo 错误: Node.js 未安装
  exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo 错误: npm 未安装
  exit /b 1
)

REM 显示Node和npm版本
echo Node.js 版本:
node -v
echo npm 版本:
npm -v

REM 清理旧的构建文件
echo 清理旧的构建文件...
call npm run clean

REM 安装依赖
echo 安装依赖...
call npm install

REM 运行测试
echo 运行测试...
call npm test
if %ERRORLEVEL% NEQ 0 (
  echo 测试失败，但继续构建...
)

REM 构建库
echo 构建库...
set NODE_ENV=production
call npm run build

REM 检查构建结果
if exist "dist" (
  echo 构建成功！
  echo 构建输出:
  dir dist
) else (
  echo 构建失败：dist 目录不存在
  exit /b 1
)

REM 生成示例
echo 生成示例...
if not exist "examples\dist" mkdir examples\dist
xcopy /E /I /Y dist\* examples\dist\

REM 构建完成
echo ✅ performance-monitor 构建完成!
echo 构建输出位于: %CD%\dist\
echo 示例文件位于: %CD%\examples\

REM 使用说明
echo 使用说明:
echo   - ESM:  import { PerformanceMonitor } from 'performance-monitor';
echo   - CommonJS: const { PerformanceMonitor } = require('performance-monitor');
echo   - 浏览器: ^<script src="performance-monitor.min.js"^>^</script^>