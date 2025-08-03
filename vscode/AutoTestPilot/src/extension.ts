import * as vscode from 'vscode';
import { TestGenerator } from './test-generator';
import { TestRunner } from './test-runner';
import { TestFixer } from './test-fixer';

// 热重载支持
if (process.env.NODE_ENV === 'development') {
  try {
    // 创建 WebSocket 连接到 Vite 开发服务器
    const WebSocket = require('ws');
    const ws = new WebSocket('ws://localhost:3030');

    ws.on('message', async (message: string) => {
      if (message === 'reload') {
        try {
          // 卸载当前插件
          const ext = vscode.extensions.getExtension('autotest-pilot');
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

    ws.on('error', (error: Error) => {
      console.log('WebSocket连接错误，可能是开发服务器未启动');
    });
  } catch (error) {
    // 忽略WebSocket错误
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('AutoTest Pilot 插件已激活');

  // 注册生成测试命令
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'autotest.generateTests',
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage('请打开编辑器');
          return;
        }

        // 获取选中的代码块
        const selectedBlocks = TestGenerator.getSelectedCodeBlocks(editor);
        if (selectedBlocks.length === 0) {
          vscode.window.showWarningMessage('请先选择代码块');
          return;
        }

        // 显示进度提示
        vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: "生成测试代码...",
          cancellable: false
        }, async (progress) => {
          try {
            // 检测测试框架
            progress.report({ message: '检测测试框架...' });
            const framework = await TestGenerator.detectTestFramework();
            if (!framework) {
              vscode.window.showErrorMessage('无法检测测试框架');
              return;
            }

            // 生成测试代码
            progress.report({ message: '生成测试代码...' });
            const testCode = await TestGenerator.generateTests(selectedBlocks, framework);

            // 创建测试文件
            progress.report({ message: '创建测试文件...' });
            const testFilePath = TestGenerator.createTestFile(editor.document.uri.fsPath, framework);
            await vscode.workspace.fs.writeFile(
              vscode.Uri.file(testFilePath),
              Buffer.from(testCode)
            );

            // 打开测试文件
            const doc = await vscode.workspace.openTextDocument(testFilePath);
            await vscode.window.showTextDocument(doc);

            // 运行测试
            progress.report({ message: '运行测试...' });
            const testResult = await TestRunner.runTests(testFilePath, framework);

            // 显示测试结果
            await TestRunner.displayTestResults(testResult, testFilePath);

            vscode.window.showInformationMessage('测试生成完成');
          } catch (error) {
            vscode.window.showErrorMessage(`测试生成失败: ${error instanceof Error ? error.message : String(error)}`);
          }
        });
      }
    )
  );

  // 注册修复测试命令
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'autotest.fixFailedTests',
      async () => {
        vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: "修复失败的测试...",
          cancellable: false
        }, async () => {
          try {
            await TestFixer.attemptAutoFix();
            vscode.window.showInformationMessage('测试修复完成');
          } catch (error) {
            vscode.window.showErrorMessage(`测试修复失败: ${error instanceof Error ? error.message : String(error)}`);
          }
        });
      }
    )
  );
}

export function deactivate() {
  console.log('AutoTest Pilot 插件已停用');
}