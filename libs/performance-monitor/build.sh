#!/bin/bash

# 安装依赖
echo "安装依赖..."
pnpm install

# 清理dist目录
echo "清理dist目录..."
pnpm run clean

# 运行构建
echo "开始构建..."
pnpm run build

# 检查构建结果
if [ -d "dist" ]; then
  echo "构建成功！"
  echo "输出文件:"
  ls -la dist/
else
  echo "构建失败！"
  exit 1
fi