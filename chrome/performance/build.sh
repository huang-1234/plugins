#!/bin/bash
set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始构建 Chrome Performance 扩展...${NC}"

# 检查环境
echo -e "${YELLOW}检查环境...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${RED}错误: Node.js 未安装${NC}"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo -e "${RED}错误: npm 未安装${NC}"
  exit 1
fi

# 显示Node和npm版本
echo -e "${GREEN}Node.js 版本:${NC} $(node -v)"
echo -e "${GREEN}npm 版本:${NC} $(npm -v)"

# 清理旧的构建文件
echo -e "${YELLOW}清理旧的构建文件...${NC}"
rm -rf dist

# 安装依赖
echo -e "${YELLOW}安装依赖...${NC}"
npm install --ignore-scripts

# 构建性能监控库
echo -e "${YELLOW}构建性能监控库依赖...${NC}"
cd ../libs/performance-monitor
npm install --ignore-scripts
npm run build
cd ../../chrome/performance

# 构建扩展
echo -e "${YELLOW}构建Chrome扩展...${NC}"
npm run build:extension

# 检查构建结果
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
  echo -e "${GREEN}构建成功！${NC}"
  echo -e "${YELLOW}构建输出:${NC}"
  ls -la dist/
else
  echo -e "${RED}构建失败：dist 目录为空或不存在${NC}"
  exit 1
fi

# 创建ZIP包
echo -e "${YELLOW}创建扩展ZIP包...${NC}"
VERSION=$(node -p "require('./package.json').version")
ZIP_NAME="memory-monitor-extension-v${VERSION}.zip"

if command -v zip &> /dev/null; then
  cd dist
  zip -r "../${ZIP_NAME}" *
  cd ..
  echo -e "${GREEN}ZIP包创建成功: ${ZIP_NAME}${NC}"
else
  echo -e "${YELLOW}警告: zip命令不可用，跳过ZIP包创建${NC}"
fi

# 构建完成
echo -e "${GREEN}✅ Chrome Performance 扩展构建完成!${NC}"
echo -e "${GREEN}构建输出位于: $(pwd)/dist/${NC}"

# 安装说明
echo -e "${YELLOW}安装说明:${NC}"
echo -e "  1. 打开Chrome浏览器，访问 chrome://extensions/"
echo -e "  2. 启用"开发者模式""
echo -e "  3. 点击"加载已解压的扩展程序"按钮"
echo -e "  4. 选择 $(pwd)/dist 目录"
echo -e "  5. 扩展程序将被安装到Chrome中"
