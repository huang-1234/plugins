#!/bin/bash
set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}     Performance Monitor 构建与发布流程${NC}"
echo -e "${BLUE}=========================================================${NC}"

# 检查环境
echo -e "\n${YELLOW}[1/7] 检查环境...${NC}"
if ! command -v pnpm &> /dev/null; then
  echo -e "${RED}错误: pnpm 未安装${NC}"
  echo -e "请运行: npm install -g pnpm"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo -e "${RED}错误: npm 未安装${NC}"
  exit 1
fi

# 显示版本信息
echo -e "Node.js 版本: $(node -v)"
echo -e "pnpm 版本: $(pnpm -v)"
echo -e "npm 版本: $(npm -v)"

# 获取当前版本
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "当前版本: ${GREEN}${CURRENT_VERSION}${NC}"

# 清理旧的构建文件
echo -e "\n${YELLOW}[2/7] 清理旧的构建文件...${NC}"
pnpm run clean

# 安装依赖
echo -e "\n${YELLOW}[3/7] 安装依赖...${NC}"
pnpm install

# 运行测试
echo -e "\n${YELLOW}[4/7] 运行测试...${NC}"
pnpm test || {
  echo -e "${RED}测试失败!${NC}"
  read -p "是否继续构建? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
}

# 构建库
echo -e "\n${YELLOW}[5/7] 使用pnpm构建库...${NC}"
NODE_ENV=production pnpm run build

# 检查构建结果
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
  echo -e "${GREEN}构建成功！${NC}"
  echo -e "构建输出:"
  ls -la dist/
else
  echo -e "${RED}构建失败：dist 目录为空或不存在${NC}"
  exit 1
fi

# 创建临时目录进行发包测试
echo -e "\n${YELLOW}[6/7] 使用npm进行发包测试...${NC}"
TEMP_DIR=$(mktemp -d)
echo -e "创建临时目录: ${TEMP_DIR}"

# 复制package.json和dist目录到临时目录
cp package.json README.md "${TEMP_DIR}/"
cp -r dist "${TEMP_DIR}/"

# 进入临时目录
pushd "${TEMP_DIR}" > /dev/null

# 修改package.json，准备发布
node -e "
const pkg = require('./package.json');
// 移除开发依赖和脚本
delete pkg.devDependencies;
delete pkg.scripts;
// 保存修改后的package.json
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
"

# 使用npm pack创建tarball但不实际发布
echo -e "创建npm包..."
npm pack

# 显示创建的包
PACKAGE_FILE=$(ls *.tgz)
echo -e "${GREEN}成功创建测试包: ${PACKAGE_FILE}${NC}"

# 验证包内容
echo -e "验证包内容:"
tar -tzf "${PACKAGE_FILE}"

# 返回原目录
popd > /dev/null

# 询问是否要发布
echo -e "\n${YELLOW}[7/7] 准备发布...${NC}"
read -p "是否要发布到npm? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
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

  # 发布到npm
  echo -e "发布到npm..."
  npm publish --tag $TAG

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}发布成功!${NC}"
    echo -e "版本 ${CURRENT_VERSION} 已发布到npm (标签: ${TAG})"
  else
    echo -e "${RED}发布失败!${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}已取消发布。${NC}"
fi

# 清理临时目录
echo -e "\n${YELLOW}清理临时文件...${NC}"
rm -rf "${TEMP_DIR}"

echo -e "\n${GREEN}构建与发布流程完成!${NC}"