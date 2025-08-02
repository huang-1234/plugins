@echo off
:: 启动 files-buffer 示例项目的批处理脚本

echo === Files-Buffer 大文件上传示例项目 ===
echo 正在准备启动服务...

:: 安装依赖
echo 正在安装依赖...
call npm run install:all

:: 启动服务
echo 正在启动服务器和前端应用...
call npm run dev

:: 脚本结束
echo 服务已启动!