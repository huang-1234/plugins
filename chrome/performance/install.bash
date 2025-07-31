#!/bin/bash

# 安装依赖
pnpm install

# 构建扩展
pnpm run build:extension

echo "扩展构建完成，请在Chrome扩展页面加载dist目录"