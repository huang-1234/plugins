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
echo -e "${BLUE}     PNPM安装依赖 + NPM发布包工作流${NC}"
echo -e "${BLUE}=========================================================${NC}"

# 获取包信息
PACKAGE_NAME=$(node -p "require('./package.json').name")
VERSION=$(node -p "require('./package.json').version")

echo -e "\n${CYAN}包信息:${NC}"
echo -e "名称: ${YELLOW}${PACKAGE_NAME}${NC}"
echo -e "版本: ${YELLOW}${VERSION}${NC}"

# 步骤1: 使用pnpm安装依赖并构建
echo -e "\n${CYAN}[步骤1] 使用pnpm安装依赖并构建${NC}"
echo -e "正在安装依赖..."
pnpm install --ignore-scripts

echo -e "正在清理旧的构建文件..."
if pnpm run clean; then
  echo -e "${GREEN}清理成功${NC}"
else
  echo -e "${YELLOW}清理命令失败，尝试手动删除dist目录...${NC}"
  if [ -d "dist" ]; then
    rm -rf dist
    echo -e "${GREEN}手动删除dist目录成功${NC}"
  else
    echo -e "${YELLOW}dist目录不存在，无需清理${NC}"
  fi
fi

echo -e "运行测试..."
if pnpm run test; then
  echo -e "${GREEN}测试完成${NC}"
else
  echo -e "${YELLOW}测试失败或没有测试脚本${NC}"
  read -p "是否继续构建? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}已取消构建${NC}"
    exit 1
  fi
fi

echo -e "构建中..."
pnpm run build

# 检查构建结果
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
  echo -e "${RED}构建失败: dist目录为空或不存在${NC}"
  exit 1
fi

echo -e "${GREEN}构建成功!${NC}"

# 步骤2: 使用npm进行发包测试
echo -e "\n${CYAN}[步骤2] 使用npm进行发包测试${NC}"
npm pack --ignore-scripts

# 检查测试包
PACKAGE_FILE=$(ls ${PACKAGE_NAME}-*.tgz 2>/dev/null | sort -V | tail -n 1)
if [ -z "$PACKAGE_FILE" ]; then
  echo -e "${RED}发包测试失败: 未找到生成的测试包${NC}"
  exit 1
fi

echo -e "${GREEN}发包测试成功: ${PACKAGE_FILE}${NC}"

# 步骤3: 选择发布标签
echo -e "\n${CYAN}[步骤3] 选择发布标签${NC}"
echo -e "1) latest - 稳定版本"
echo -e "2) beta - 测试版本"
echo -e "3) alpha - 内测版本"
echo -e "4) next - 预览版本"
echo -e "5) rc - 候选发布版本"
echo -e "6) 自定义标签"

read -p "请选择 (默认: 1): " TAG_CHOICE
echo

case $TAG_CHOICE in
  1|"") TAG="latest" ;;
  2) TAG="beta" ;;
  3) TAG="alpha" ;;
  4) TAG="next" ;;
  5) TAG="rc" ;;
  6)
    read -p "请输入自定义标签名: " TAG
    if [ -z "$TAG" ]; then
      echo -e "${RED}错误: 标签名不能为空${NC}"
      exit 1
    fi
    ;;
  *)
    echo -e "${YELLOW}无效选择，使用默认标签 'latest'${NC}"
    TAG="latest"
    ;;
esac

echo -e "使用标签: ${GREEN}${TAG}${NC}"

# 步骤4: 确认发布信息
echo -e "\n${CYAN}[步骤4] 确认发布信息${NC}"
echo -e "包名: ${YELLOW}${PACKAGE_NAME}${NC}"
echo -e "版本: ${YELLOW}${VERSION}${NC}"
echo -e "标签: ${YELLOW}${TAG}${NC}"

# 检查npm登录状态
echo -e "\n检查npm登录状态..."
NPM_USER=$(npm whoami 2>/dev/null || echo "")

if [ -z "$NPM_USER" ]; then
  echo -e "${RED}错误: 未登录npm${NC}"
  echo -e "请先运行: ${YELLOW}npm login${NC}"
  exit 1
fi

echo -e "已登录为: ${GREEN}${NPM_USER}${NC}"

# 确认发布
read -p "是否确认发布到npm? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}已取消发布${NC}"
  exit 0
fi

# 步骤5: 执行发布
echo -e "\n${CYAN}[步骤5] 执行发布${NC}"
echo -e "正在发布到npm..."

# 选择发布方式
echo -e "选择发布方式:"
echo -e "1) 标准发布"
echo -e "2) 带OTP验证码发布 (双因素认证)"
echo -e "3) 干运行模式 (不实际发布)"

read -p "请选择 (默认: 1): " PUBLISH_MODE
echo

PUBLISH_CMD="npm publish --tag $TAG --ignore-scripts"

case $PUBLISH_MODE in
  2)
    read -p "请输入OTP验证码: " OTP_CODE
    PUBLISH_CMD="$PUBLISH_CMD --otp=$OTP_CODE"
    ;;
  3)
    PUBLISH_CMD="$PUBLISH_CMD --dry-run"
    echo -e "${YELLOW}干运行模式 - 不会实际发布${NC}"
    ;;
esac

# 执行发布命令
eval $PUBLISH_CMD

# 检查发布结果
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✅ 发布成功!${NC}"
  echo -e "版本 ${VERSION} 已发布到npm (标签: ${TAG})"
  echo -e "可以通过以下命令安装:"
  echo -e "${CYAN}npm install ${PACKAGE_NAME}@${TAG}${NC}"

  # 清理测试包
  read -p "是否删除测试包 ${PACKAGE_FILE}? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f "$PACKAGE_FILE"
    echo -e "测试包已删除"
  fi

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

echo -e "\n${GREEN}PNPM安装依赖 + NPM发布包工作流完成!${NC}"