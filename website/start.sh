#!/bin/bash

# 安装依赖
pnpm install
# 启动后端
pnpm --filter ./server dev
# 启动前端
pnpm --filter ./web dev
# 等待前端和后端都启动成功
wait
