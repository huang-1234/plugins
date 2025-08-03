# AutoTest Pilot - VSCode插件

AutoTest Pilot是一个智能的VSCode插件，允许开发者选择代码块，自动生成测试，运行测试，并智能修复失败的测试。

## 功能特点

- ✅ **选择代码自动生成测试**：选中代码，一键生成测试用例
- 🔍 **自动检测测试框架**：支持Jest、Mocha、Vitest、Jasmine等主流测试框架
- 🚀 **一键运行测试**：生成后自动运行测试并显示结果
- 🛠️ **智能修复失败测试**：AI辅助修复失败的测试用例
- ⚡ **基于Vite构建**：享受现代化前端工具链的开发体验

## 安装

1. 在VSCode扩展市场搜索"AutoTest Pilot"
2. 点击安装
3. 重启VSCode

## 使用方法

### 生成测试

1. 打开要测试的代码文件
2. 选择要测试的代码块
3. 按下`Ctrl+Alt+T`或在命令面板中运行"生成测试代码"命令
4. 插件会自动检测项目使用的测试框架，或提示您选择一个
5. 测试代码会在`__tests__`目录下生成，并自动打开

### 修复失败的测试

1. 打开失败的测试文件
2. 按下`Ctrl+Alt+F`或在命令面板中运行"修复失败的测试"命令
3. 插件会分析失败原因并尝试修复

## 配置选项

在VSCode设置中，可以配置以下选项：

```json
{
  "autotest.aiApiKey": "your-api-key",
  "autotest.testDirectory": "__tests__",
  "autotest.testFileNaming": "{name}.test.{ext}",
  "autotest.autoRunTests": true
}
```

## 开发

本项目使用Vite进行开发，提供快速的热重载体验。

### 开发环境设置

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

在VSCode中按F5启动调试。

### 构建

```bash
# 构建插件
pnpm build

# 打包为.vsix文件
pnpm package
```

## 技术栈

- TypeScript
- Vite
- VSCode Extension API
- Anthropic Claude API

## 许可证

ISC

## 贡献

欢迎提交Issue和Pull Request！