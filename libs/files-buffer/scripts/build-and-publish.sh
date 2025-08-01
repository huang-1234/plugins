#!/bin/bash

# 构建和发布 files-buffer 包的 Shell 脚本

# 获取当前目录
CURRENT_DIR=$(pwd)

# 检查是否在正确的目录中
if [ ! -f "$CURRENT_DIR/package.json" ]; then
  echo "错误: 请在 files-buffer 包根目录中运行此脚本"
  exit 1
fi

# 读取版本
VERSION=$(node -p "require('./package.json').version")
echo "当前版本: $VERSION"

# 清理
echo "清理旧的构建文件..."
if [ -d "$CURRENT_DIR/dist" ]; then
  rm -rf "$CURRENT_DIR/dist"
fi

# 安装依赖
echo "安装依赖..."
npm install

# 运行测试
echo "运行测试..."
npm test

# 构建
echo "构建包..."
npm run build

# 检查构建结果
if [ ! -d "$CURRENT_DIR/dist" ]; then
  echo "错误: 构建失败，没有生成 dist 目录"
  exit 1
fi

# 检查是否有必要的文件
for file in "index.js" "index.cjs" "index.d.ts"; do
  if [ ! -f "$CURRENT_DIR/dist/$file" ]; then
    echo "错误: 构建后缺少必要文件 $file"
    exit 1
  fi
done

# 询问是否发布
read -p "是否发布到 npm? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "发布到 npm..."
  npm run publish-npm
  echo "files-buffer@$VERSION 已成功发布!"
else
  echo "跳过发布步骤。"
fi

echo "构建完成!"