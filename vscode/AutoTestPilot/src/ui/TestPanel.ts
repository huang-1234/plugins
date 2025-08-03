import * as vscode from 'vscode';
import * as path from 'path';

/**
 * 测试结果面板
 * 使用VSCode的WebView API展示测试结果
 */
export default class TestPanel {
  private readonly panel: vscode.WebviewPanel;
  private readonly testFilePath: string;
  private readonly testResults: string;
  private disposables: vscode.Disposable[] = [];

  constructor(testFilePath: string, testResults: string) {
    this.testFilePath = testFilePath;
    this.testResults = testResults;

    // 创建WebView面板
    this.panel = vscode.window.createWebviewPanel(
      'testResults',
      '测试结果',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.dirname(testFilePath))
        ]
      }
    );

    // 设置HTML内容
    this.panel.webview.html = this.getWebviewContent();

    // 处理消息
    this.panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'fixTest':
            vscode.commands.executeCommand('autotest.fixFailedTests');
            return;
        }
      },
      null,
      this.disposables
    );

    // 面板关闭时清理资源
    this.panel.onDidDispose(
      () => this.dispose(),
      null,
      this.disposables
    );
  }

  // 显示面板
  public show(): void {
    this.panel.reveal();
  }

  // 清理资源
  public dispose(): void {
    this.panel.dispose();
    this.disposables.forEach(d => d.dispose());
  }

  // 生成WebView内容
  private getWebviewContent(): string {
    // 解析测试结果
    const { passed, failed, total } = this.parseTestResults(this.testResults);
    const success = failed === 0;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>测试结果</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      padding: 20px;
      color: var(--vscode-editor-foreground);
      background-color: var(--vscode-editor-background);
    }
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    .status-badge {
      padding: 8px 16px;
      border-radius: 4px;
      margin-right: 15px;
      font-weight: bold;
    }
    .success {
      background-color: #388e3c;
      color: white;
    }
    .failure {
      background-color: #d32f2f;
      color: white;
    }
    .summary {
      margin-bottom: 20px;
    }
    .progress-bar {
      height: 10px;
      background-color: #e0e0e0;
      border-radius: 5px;
      margin: 10px 0;
      overflow: hidden;
    }
    .progress-value {
      height: 100%;
      background-color: ${success ? '#388e3c' : '#d32f2f'};
      border-radius: 5px;
      width: ${successRate}%;
    }
    .results {
      font-family: 'Courier New', Courier, monospace;
      white-space: pre-wrap;
      padding: 15px;
      background-color: var(--vscode-editor-inactiveSelectionBackground);
      border-radius: 4px;
      max-height: 500px;
      overflow: auto;
    }
    .actions {
      margin-top: 20px;
    }
    button {
      padding: 8px 16px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="status-badge ${success ? 'success' : 'failure'}">
      ${success ? '✓ 通过' : '✗ 失败'}
    </div>
    <h2>测试结果</h2>
  </div>

  <div class="summary">
    <div>测试文件: ${path.basename(this.testFilePath)}</div>
    <div>通过: ${passed} / 失败: ${failed} / 总计: ${total}</div>
    <div class="progress-bar">
      <div class="progress-value"></div>
    </div>
  </div>

  <div class="results">
${this.escapeHtml(this.testResults)}
  </div>

  <div class="actions">
    ${failed > 0 ? '<button id="fixBtn">自动修复失败的测试</button>' : ''}
    <button id="runBtn">重新运行测试</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    document.getElementById('runBtn')?.addEventListener('click', () => {
      vscode.postMessage({
        command: 'runTest'
      });
    });

    document.getElementById('fixBtn')?.addEventListener('click', () => {
      vscode.postMessage({
        command: 'fixTest'
      });
    });
  </script>
</body>
</html>`;
  }

  // 解析测试结果
  private parseTestResults(results: string): { passed: number; failed: number; total: number } {
    // 简单解析，实际项目中可以使用更复杂的解析逻辑
    const passedMatch = results.match(/(\d+) passed/i);
    const failedMatch = results.match(/(\d+) failed/i);
    const totalMatch = results.match(/(\d+) total/i);

    const passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
    const total = totalMatch ? parseInt(totalMatch[1], 10) : (passed + failed);

    return { passed, failed, total };
  }

  // HTML转义
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}