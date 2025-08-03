#!/bin/bash

# 安装依赖
pnpm install

# 构建前端
pnpm --filter ./web build
# 构建后端
pnpm --filter ./server build

# 打包前端
pnpm --filter ./web build
# 打包后端
pnpm --filter ./server build