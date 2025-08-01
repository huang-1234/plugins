#!/bin/bash
set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}     Performance Monitor 一键式构建与发布流程${NC}"
echo -e "${BLUE}=========================================================${NC}"

echo -e "\n${CYAN}该脚本将执行以下步骤:${NC}"
echo -e "1. 使用 pnpm 安装依赖并构建库"
echo -e "2. 使用 npm 进行发包测试"
echo -e "3. 发布到 npm 仓库"

read -p "是否继续? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}已取消操作${NC}"
  exit 0
fi

# 步骤1: 使用pnpm构建
echo -e "\n${YELLOW}[1/3] 使用pnpm构建库...${NC}"
pnpm install
pnpm run clean
pnpm run test || {
  echo -e "${RED}测试失败，但继续构建...${NC}"
}
pnpm run build

# 检查构建结果
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
  echo -e "${RED}构建失败: dist目录为空或不存在${NC}"
  exit 1
fi

echo -e "${GREEN}pnpm构建成功!${NC}"

# 步骤2: 使用npm进行发包测试
echo -e "\n${YELLOW}[2/3] 使用npm进行发包测试...${NC}"
npm pack

# 检查测试包
PACKAGE_FILE=$(ls perfor-monitor-*.tgz 2>/dev/null | sort -V | tail -n 1)
if [ -z "$PACKAGE_FILE" ]; then
  echo -e "${RED}发包测试失败: 未找到生成的测试包${NC}"
  exit 1
fi

echo -e "${GREEN}发包测试成功: ${PACKAGE_FILE}${NC}"

# 清理测试包
rm -f "$PACKAGE_FILE"

# 步骤3: 发布到npm
echo -e "\n${YELLOW}[3/3] 准备发布到npm...${NC}"

# 选择发布标签
echo -e "选择发布标签:"
echo -e "1) latest (稳定版)"
echo -e "2) beta (测试版)"
echo -e "3) alpha (内测版)"
echo -e "4) next (预览版)"
read -p "请选择 (1-4): " -n 1 -r TAG_CHOICE
echo

case $TAG_CHOICE in
  1) TAG="latest" ;;
  2) TAG="beta" ;;
  3) TAG="alpha" ;;
  4) TAG="next" ;;
  *)
    echo -e "${RED}无效选择，使用默认标签 'latest'${NC}"
    TAG="latest"
    ;;
esac

echo -e "使用标签: ${GREEN}${TAG}${NC}"

# 确认发布
read -p "是否确认发布到npm? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}已取消发布${NC}"
  exit 0
fi

# 执行发布
echo -e "正在发布到npm..."
npm publish --tag $TAG

if [ $? -eq 0 ]; then
  VERSION=$(node -p "require('./package.json').version")
  echo -e "${GREEN}发布成功!${NC}"
  echo -e "版本 ${VERSION} 已发布到npm (标签: ${TAG})"
  echo -e "可以通过以下命令安装:"
  echo -e "${CYAN}npm install perfor-monitor@${TAG}${NC}"
else
  echo -e "${RED}发布失败!${NC}"
  exit 1
fi

echo -e "\n${GREEN}一键式构建与发布流程完成!${NC}"