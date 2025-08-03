import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { generateWithAI } from '../ai-engine';

export class TestFixer {
  // 尝试自动修复测试
  static async attemptAutoFix(): Promise<void> {
    const testFilePath = await this.findActiveTestFile();
    if (!testFilePath) {
      vscode.window.showWarningMessage('未找到活动的测试文件');
      return;
    }

    try {
      // 读取测试文件内容
      const testFileUri = vscode.Uri.file(testFilePath);
      const testFileContent = await vscode.workspace.fs.readFile(testFileUri);
      const testCode = testFileContent.toString();

      // 获取测试输出
      const testOutput = await this.getTestOutput();

      // 构建修复提示词
      const prompt = this.buildFixPrompt(testCode, testOutput);

      // 使用AI生成修复后的代码
      const fixedCode = await generateWithAI(prompt);

      // 写入修复后的代码
      await vscode.workspace.fs.writeFile(
        testFileUri,
        Buffer.from(fixedCode)
      );

      // 打开修复后的文件
      const doc = await vscode.workspace.openTextDocument(testFilePath);
      await vscode.window.showTextDocument(doc);

      vscode.window.showInformationMessage('测试修复完成!');
    } catch (error) {
      throw new Error(`修复失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 获取最近的测试输出
  private static async getTestOutput(): Promise<string> {
    // 实际实现中应该从输出通道获取最近的测试运行结果
    // 这里返回模拟数据
    if (process.env.NODE_ENV === 'development') {
      return `
FAIL  __tests__/example.test.js
  ● 计算函数 › 应该正确处理除法

    expect(received).toBe(expected) // Object.is equality

    Expected: 2
    Received: 2.5

      12 |   });
      13 |   it('应该正确处理除法', () => {
    > 14 |     expect(divide(5, 2)).toBe(2);
         |                          ^
      15 |   });
      16 | });

Test Suites: 1 failed, 0 passed, 1 total
Tests:       1 failed, 1 passed, 2 total
`;
    }

    // 尝试从输出通道获取
    const outputChannels = await vscode.window.visibleTextEditors
      .filter(editor => editor.document.uri.scheme === 'output')
      .map(editor => editor.document.getText());

    if (outputChannels.length > 0) {
      return outputChannels[0];
    }

    return '未找到测试输出，请先运行测试';
  }

  // 构建修复提示词
  private static buildFixPrompt(testCode: string, testOutput: string): string {
    return `
以下测试代码执行失败：
\`\`\`javascript
${testCode}
\`\`\`

测试输出：
\`\`\`
${testOutput}
\`\`\`

请：
1. 分析失败原因
2. 提供完整修复后的测试代码
3. 保持原有测试结构
4. 输出纯代码，无需解释`;
  }

  // 查找活动的测试文件
  private static async findActiveTestFile(): Promise<string | null> {
    // 首先检查当前活动的编辑器
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      const filePath = activeEditor.document.uri.fsPath;

      // 如果当前文件是测试文件，直接返回
      if (this.isTestFile(filePath)) {
        return filePath;
      }

      // 尝试查找对应的测试文件
      const possibleTestFile = await this.findCorrespondingTestFile(filePath);
      if (possibleTestFile) {
        return possibleTestFile;
      }
    }

    // 如果没有找到，让用户选择测试文件
    const testFiles = await this.findAllTestFiles();
    if (testFiles.length === 0) {
      return null;
    }

    if (testFiles.length === 1) {
      return testFiles[0];
    }

    // 显示测试文件列表供用户选择
    const selectedFile = await vscode.window.showQuickPick(
      testFiles.map(file => ({
        label: path.basename(file),
        description: file,
        file
      })),
      { placeHolder: '选择要修复的测试文件' }
    );

    return selectedFile ? selectedFile.file : null;
  }

  // 判断是否为测试文件
  private static isTestFile(filePath: string): boolean {
    const fileName = path.basename(filePath).toLowerCase();
    return fileName.includes('.test.') ||
           fileName.includes('.spec.') ||
           filePath.includes('__tests__/');
  }

  // 查找对应的测试文件
  private static async findCorrespondingTestFile(sourcePath: string): Promise<string | null> {
    const fileName = path.basename(sourcePath);
    const dirName = path.dirname(sourcePath);
    const baseName = fileName.replace(/\.\w+$/, '');

    // 可能的测试文件路径
    const possiblePaths = [
      path.join(dirName, '__tests__', `${baseName}.test.js`),
      path.join(dirName, '__tests__', `${baseName}.test.ts`),
      path.join(dirName, '__tests__', `${baseName}.test.tsx`),
      path.join(dirName, '__tests__', `${baseName}.spec.js`),
      path.join(dirName, '__tests__', `${baseName}.spec.ts`),
      path.join(dirName, '__tests__', `${baseName}.spec.tsx`),
      path.join(dirName, `${baseName}.test.js`),
      path.join(dirName, `${baseName}.test.ts`),
      path.join(dirName, `${baseName}.test.tsx`),
      path.join(dirName, `${baseName}.spec.js`),
      path.join(dirName, `${baseName}.spec.ts`),
      path.join(dirName, `${baseName}.spec.tsx`),
    ];

    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        return testPath;
      }
    }

    return null;
  }

  // 查找所有测试文件
  private static async findAllTestFiles(): Promise<string[]> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceRoot) return [];

    // 使用VSCode API查找测试文件
    const testFiles = await vscode.workspace.findFiles(
      '{**/*.test.js,**/*.test.ts,**/*.test.tsx,**/*.spec.js,**/*.spec.ts,**/*.spec.tsx,**/__tests__/**/*.js,**/__tests__/**/*.ts,**/__tests__/**/*.tsx}',
      '**/node_modules/**'
    );

    return testFiles.map(file => file.fsPath);
  }
}