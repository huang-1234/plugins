#!/bin/bash
set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# 获取包信息
PACKAGE_NAME=$(node -p "require('./package.json').name")
VERSION=$(node -p "require('./package.json').version")

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    发布 ${PACKAGE_NAME} v${VERSION} 到 NPM    ${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查npm登录状态
echo -e "\n${YELLOW}检查npm登录状态...${NC}"
NPM_USER=$(npm whoami 2>/dev/null || echo "")

if [ -z "$NPM_USER" ]; then
  echo -e "${RED}错误: 未登录npm${NC}"
  echo -e "请先运行: ${YELLOW}npm login${NC}"
  exit 1
fi

echo -e "${GREEN}已登录为: $NPM_USER${NC}"

# 选择发布标签
echo -e "\n${YELLOW}选择发布标签:${NC}"
echo "1) latest - 稳定版本"
echo "2) beta - 测试版本"
echo "3) alpha - 内测版本"
echo "4) next - 预览版本"
echo "5) 自定义标签"

read -p "请选择 (默认: 1): " TAG_CHOICE
echo

case $TAG_CHOICE in
  1|"") TAG="latest" ;;
  2) TAG="beta" ;;
  3) TAG="alpha" ;;
  4) TAG="next" ;;
  5)
    read -p "请输入自定义标签名: " TAG
    if [ -z "$TAG" ]; then
      echo -e "${RED}错误: 标签名不能为空${NC}"
      exit 1
    fi
    ;;
  *)
    echo -e "${RED}无效选择，使用默认标签 'latest'${NC}"
    TAG="latest"
    ;;
esac

echo -e "使用标签: ${GREEN}${TAG}${NC}"

# 确认发布前的准备工作
echo -e "\n${YELLOW}发布前准备:${NC}"
echo "1) 仅发布 (假设已构建)"
echo "2) 构建并发布"
echo "3) 测试、构建并发布"

read -p "请选择 (默认: 2): " BUILD_CHOICE
echo

case $BUILD_CHOICE in
  1)
    echo -e "${YELLOW}跳过构建步骤...${NC}"
    ;;
  2|"")
    echo -e "${YELLOW}构建中...${NC}"
    npm run build
    ;;
  3)
    echo -e "${YELLOW}测试中...${NC}"
    npm test || {
      echo -e "${RED}测试失败!${NC}"
      read -p "是否继续发布? (y/n): " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
      fi
    }

    echo -e "${YELLOW}构建中...${NC}"
    npm run build
    ;;
  *)
    echo -e "${RED}无效选择，使用默认选项 '构建并发布'${NC}"
    npm run build
    ;;
esac

# 确认发布信息
echo -e "\n${YELLOW}发布信息确认:${NC}"
echo -e "包名: ${GREEN}${PACKAGE_NAME}${NC}"
echo -e "版本: ${GREEN}${VERSION}${NC}"
echo -e "标签: ${GREEN}${TAG}${NC}"
echo -e "发布者: ${GREEN}${NPM_USER}${NC}"

read -p "确认发布? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}已取消发布${NC}"
  exit 0
fi

# 执行发布
echo -e "\n${YELLOW}正在发布到npm...${NC}"
npm publish --tag $TAG

# 检查发布结果
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✅ 发布成功!${NC}"
  echo -e "包已发布: ${BLUE}${PACKAGE_NAME}@${VERSION}${NC} (标签: ${TAG})"
  echo -e "可通过以下命令安装:"
  echo -e "${BLUE}npm install ${PACKAGE_NAME}@${TAG}${NC}"

  # 创建git标签
  read -p "是否创建git标签 v${VERSION}? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git tag -a "v${VERSION}" -m "Release ${VERSION}"
    git push origin "v${VERSION}"
    echo -e "${GREEN}Git标签已创建并推送: v${VERSION}${NC}"
  fi
else
  echo -e "\n${RED}❌ 发布失败!${NC}"
  exit 1
fi
