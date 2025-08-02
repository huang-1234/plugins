#!/bin/bash

# 启动 files-buffer 示例项目的脚本

# 获取当前目录
CURRENT_DIR=$(pwd)

echo "=== Files-Buffer 大文件上传示例项目 ==="
echo "正在准备启动服务..."

# 安装依赖
echo "正在安装依赖..."
pnpm install

# 启动服务
echo "正在启动服务器和前端应用..."
pnpm start:server
pnpm start:web

# 脚本结束
echo "服务已启动!"