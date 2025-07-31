@echo off
echo 开始构建 Chrome Performance 扩展...

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
if exist "dist" rd /s /q dist

REM 安装依赖
echo 安装依赖...
call npm install --ignore-scripts

REM 构建性能监控库
echo 构建性能监控库依赖...
cd ..\libs\performance-monitor
call npm install --ignore-scripts
call npm run build
cd ..\..\chrome\performance

REM 构建扩展
echo 构建Chrome扩展...
call npm run build:extension

REM 检查构建结果
if exist "dist" (
  echo 构建成功！
  echo 构建输出:
  dir dist
) else (
  echo 构建失败：dist 目录不存在
  exit /b 1
)

REM 创建ZIP包
echo 创建扩展ZIP包...
for /f "tokens=*" %%a in ('node -p "require('./package.json').version"') do set VERSION=%%a
set ZIP_NAME=memory-monitor-extension-v%VERSION%.zip

REM 尝试使用PowerShell创建ZIP文件
echo 使用PowerShell创建ZIP包...
powershell -Command "Compress-Archive -Path dist\* -DestinationPath %ZIP_NAME% -Force"
if %ERRORLEVEL% EQU 0 (
  echo ZIP包创建成功: %ZIP_NAME%
) else (
  echo 警告: 无法创建ZIP包，请手动压缩dist目录
)

REM 构建完成
echo ✅ Chrome Performance 扩展构建完成!
echo 构建输出位于: %CD%\dist\

REM 安装说明
echo 安装说明:
echo   1. 打开Chrome浏览器，访问 chrome://extensions/
echo   2. 启用"开发者模式"
echo   3. 点击"加载已解压的扩展程序"按钮
echo   4. 选择 %CD%\dist 目录
echo   5. 扩展程序将被安装到Chrome中