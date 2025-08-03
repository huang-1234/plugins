# 使用 Vite 开发 VSCode 插件指南

## 为什么选择 Vite 开发 VSCode 插件？

Vite 是现代化的前端构建工具，相比传统 Webpack 具有：
- ⚡ 闪电般的冷启动（秒级）
- 🔥 超快的热更新（<50ms）
- 📦 开箱即用的 TypeScript/JSX 支持
- 🧩 丰富的插件生态系统

将 Vite 引入 VSCode 插件开发可以大幅提升开发体验！

---

## 完整开发流程

### 1. 初始化项目
```bash
# 创建项目目录
mkdir vite-vscode-plugin && cd vite-vscode-plugin

# 初始化 Node 项目
npm init -y

# 安装 Vite
npm install vite vite-plugin-vscode -D

# 创建必要文件
touch vite.config.js
mkdir src
touch src/extension.js
touch src/testRunner.js
touch src/testGenerator.js
```

### 2. 配置 Vite (vite.config.js)

```javascript
import { defineConfig } from 'vite';
import vscode from 'vite-plugin-vscode';

export default defineConfig({
  plugins: [
    vscode({
      // VSCode 插件配置
      entry: 'src/extension.js',
      outDir: 'dist',
      build: {
        minify: false,
        target: 'node16',
        external: ['vscode', 'fs', 'path', 'child_process'],
      },
      debug: true, // 调试模式
    })
  ],
  // 开发服务器配置
  server: {
    hmr: {
      port: 3030,
    }
  }
});
```

### 3. 配置 package.json

```json
{
  "name": "vite-vscode-plugin",
  "version": "0.1.0",
  "description": "基于 Vite 的 VSCode 插件开发",
  "main": "dist/extension.js",
  "engines": {
    "vscode": "^1.85.0"
  },
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "package": "vite build && vsce package"
  },
  "activationEvents": [
    "onCommand:vitePlugin.generateTests"
  ],
  "contributes": {
    "commands": [
      {
        "command": "vitePlugin.generateTests",
        "title": "生成测试代码",
        "category": "Vite Plugin"
      }
    ]
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.1",
    "vite": "^5.2.11",
    "vite-plugin-vscode": "^0.3.1",
    "vsce": "^2.16.0"
  },
  "dependencies": {
    "@babel/core": "^7.24.0",
    "node-fetch": "^3.0.0"
  }
}
```

### 4. 插件核心代码 (src/extension.js)

```javascript
const vscode = require('vscode');
const { TestGenerator } = require('./testGenerator');
const { TestRunner } = require('./testRunner');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // 注册命令
  const command = vscode.commands.registerCommand(
    'vitePlugin.generateTests',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('请打开编辑器');
        return;
      }

      // 获取选中代码
      const selectedCode = editor.document.getText(editor.selection);

      // 生成测试代码
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "生成测试代码...",
        cancellable: false
      }, async () => {
        try {
          const framework = await detectTestFramework();
          const testCode = await TestGenerator.generate(selectedCode, framework);

          // 创建测试文件
          const testFilePath = createTestFile(editor.document.uri.fsPath);
          await writeFile(testFilePath, testCode);

          // 打开测试文件
          const doc = await vscode.workspace.openTextDocument(testFilePath);
          vscode.window.showTextDocument(doc);

          // 运行测试
          const testResults = await TestRunner.run(testFilePath, framework);
          vscode.window.showInformationMessage(`测试完成: ${testResults.summary}`);

        } catch (error) {
          vscode.window.showErrorMessage(`测试生成失败: ${error.message}`);
        }
      });
    }
  );

  context.subscriptions.push(command);
}

async function detectTestFramework() {
  // 实际实现中会根据项目依赖自动检测
  return vscode.window.showQuickPick(['Jest', 'Mocha', 'Vitest'], {
    placeHolder: '请选择测试框架'
  });
}

function createTestFile(sourcePath) {
  // 实现逻辑与之前类似
  // ...
}

module.exports = { activate };
```

### 5. 测试生成模块 (src/testGenerator.js)

```javascript
import { fetch } from 'node-fetch';

export class TestGenerator {
  static async generate(code, framework) {
    // 开发模式下使用本地模拟数据
    if (process.env.NODE_ENV === 'development') {
      return this.mockGeneration(code, framework);
    }

    // 生产模式使用AI生成
    return this.generateWithAI(code, framework);
  }

  static mockGeneration(code, framework) {
    return `
      // 由 Vite VSCode 插件生成的测试代码
      // 框架: ${framework}
      // 时间: ${new Date().toISOString()}

      describe("自动生成的测试套件", () => {
        it("应该返回正确结果", () => {
          // 测试逻辑位于此处
        });

        it("应该处理边界情况", () => {
          // 边界测试逻辑
        });
      });
    `;
  }

  static async generateWithAI(code, framework) {
    const response = await fetch('https://api.vite-plugin.com/generate', {
      method: 'POST',
      body: JSON.stringify({ code, framework })
    });

    if (!response.ok) {
      throw new Error('AI生成失败');
    }

    return response.text();
  }
}
```

## 开发工作流

### 开发模式
```bash
# 启动 Vite 开发服务器
npm run dev

# 在 VSCode 中按 F5 启动调试
```

### 打包发布
```bash
# 生产环境构建
npm run build

# 打包成 .vsix 文件
npm run package
```

## Vite 热重载配置

```javascript
// 在 src/extension.js 中添加
if (process.env.NODE_ENV === 'development') {
  // 创建 WebSocket 连接到 Vite 开发服务器
  const ws = new WebSocket('ws://localhost:3030');

  ws.on('message', async (message) => {
    if (message === 'reload') {
      try {
        // 卸载当前插件
        const ext = vscode.extensions.getExtension('your.plugin.id');
        if (ext) {
          if (!ext.isActive) return;

          // 调用插件的 deactivate 方法
          if (ext.exports && ext.exports.deactivate) {
            await ext.exports.deactivate();
          }

          // 重新加载窗口
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      } catch (error) {
        console.error('重载失败:', error);
      }
    }
  });
}
```

## 项目结构优化

推荐的文件结构：
```
vite-vscode-plugin/
├── dist/                   # Vite 打包输出
├── src/                    # 源代码
│   ├── extension.js        # 插件主入口
│   ├── testGenerator.js    # 测试生成模块
│   ├── testRunner.js       # 测试运行模块
│   └── ui/                 # UI 组件
│       ├── TestPanel.js    # 测试结果面板
│       └── CommandPalette.js
├── vite.config.js          # Vite 配置
├── package.json
└── .vscode/                # VSCode 调试配置
    └── launch.json
```

## 调试配置 (.vscode/launch.json)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "preLaunchTask": "npm: dev",
      "env": {
        "VSCODE_DEBUG": "true",
        "NODE_ENV": "development"
      }
    }
  ]
}
```

## 性能优化技巧

1. **按需加载组件**
```javascript
// 仅在使用时加载资源
const testPanel = await import('./ui/TestPanel');
const panel = new testPanel.TestPanel(context);
```

2. **缓存生成结果**
```javascript
import lruCache from 'lru-cache';

const testCache = new lruCache({
  max: 100,
  ttl: 60 * 60 * 1000 // 1小时
});

static generate(code, framework) {
  const key = `${framework}-${hash(code)}`;

  if (testCache.has(key)) {
    return testCache.get(key);
  }

  const result = // 生成逻辑...
  testCache.set(key, result);

  return result;
}
```

3. **使用 Web Workers**
```javascript
// 创建测试生成 Worker
const testWorker = new Worker(
  new URL('./testGenerator.worker.js', import.meta.url)
);

// 与 Worker 通信
testWorker.postMessage({
  type: 'generate',
  payload: { code, framework }
});

testWorker.onmessage = (e) => {
  if (e.data.type === 'result') {
    // 处理测试生成结果
  }
};
```

## 与 Webview 集成

```javascript
// 创建 Webview 面板
const panel = vscode.window.createWebviewPanel(
  'testResults',
  '测试结果',
  vscode.ViewColumn.Beside,
  {
    enableScripts: true,
    localResourceRoots: [
      vscode.Uri.file(path.join(context.extensionPath, 'dist'))
    ]
  }
);

// 使用 Vite 生成的资源
const scriptUri = panel.webview.asWebviewUri(
  vscode.Uri.file(path.join(context.extensionPath, 'dist', 'main.js'))
);

panel.webview.html = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>测试结果面板</title>
      <script type="module" src="${scriptUri}"></script>
    </head>
    <body>
      <div id="app"></div>
    </body>
  </html>
`;
```

## 部署到市场

```bash
# 安装 vsce
npm install -g vsce

# 创建发布者账号
vsce create-publisher your-publisher-name

# 打包插件
vsce package

# 发布到市场
vsce publish
```

## VSCode 插件开发的 Vite 优势

1. **快速开发迭代**
   - 平均 HMR 速度: 50ms vs Webpack 的 800ms+
   - 重新加载次数减少 80%

2. **更小的打包体积**
   - Vite 输出约小 40% 的包大小
   - Tree-shaking 效果更好

3. **现代化开发体验**
   - 原生 ES 模块支持
   - TypeScript 开箱即用
   - 轻松集成现代化 UI 框架

4. **统一工具链**
   - 与前端应用使用相同构建工具
   - 共享组件和工具

使用 Vite 开发 VSCode 插件，可以让你的开发体验迈入现代前端开发的快车道！