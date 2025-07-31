#!/bin/bash
set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始构建 perfor-monitor 包...${NC}"

# 检查环境
echo -e "${YELLOW}检查环境...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${RED}错误: Node.js 未安装${NC}"
  exit 1
fi

if ! command -v pnpm &> /dev/null; then
  echo -e "${RED}错误: pnpm 未安装${NC}"
  exit 1
fi

# 显示Node和pnpm版本
echo -e "${GREEN}Node.js 版本:${NC} $(node -v)"
echo -e "${GREEN}pnpm 版本:${NC} $(pnpm -v)"

# 清理旧的构建文件
echo -e "${YELLOW}清理旧的构建文件...${NC}"
pnpm run clean

# 安装依赖
echo -e "${YELLOW}安装依赖...${NC}"
pnpm install

# 运行测试
echo -e "${YELLOW}运行测试...${NC}"
pnpm test || {
  echo -e "${RED}测试失败，但继续构建...${NC}"
}

# 构建库
echo -e "${YELLOW}构建库...${NC}"
NODE_ENV=production pnpm run build

# 检查构建结果
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
  echo -e "${GREEN}构建成功！${NC}"
  echo -e "${YELLOW}构建输出:${NC}"
  ls -la dist/
else
  echo -e "${RED}构建失败：dist 目录为空或不存在${NC}"
  exit 1
fi

# 生成示例
echo -e "${YELLOW}生成示例...${NC}"
mkdir -p examples/dist
cp -r dist/* examples/dist/

# 构建完成
echo -e "${GREEN}✅ perfor-monitor 构建完成!${NC}"
echo -e "${GREEN}构建输出位于: $(pwd)/dist/${NC}"
echo -e "${GREEN}示例文件位于: $(pwd)/examples/${NC}"

# 使用说明
echo -e "${YELLOW}使用说明:${NC}"
echo -e "  - ESM:  import { PerformanceMonitor } from 'perfor-monitor';"
echo -e "  - CommonJS: const { PerformanceMonitor } = require('perfor-monitor');"
echo -e "  - 浏览器: <script src=\"perfor-monitor.min.js\"></script>"
