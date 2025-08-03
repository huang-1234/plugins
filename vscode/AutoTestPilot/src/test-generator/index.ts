import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { generateWithAI } from '../ai-engine';

export class TestGenerator {
  // 获取选中的代码块
  static getSelectedCodeBlocks(editor: vscode.TextEditor): string[] {
    if (editor.selections.length === 0 || editor.selections[0].isEmpty) {
      return [];
    }

    return editor.selections.map(selection =>
      editor.document.getText(selection)
    );
  }

  // 检测测试框架
  static async detectTestFramework(): Promise<string | null> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceRoot) return null;

    const packagePath = path.join(workspaceRoot, 'package.json');
    if (!fs.existsSync(packagePath)) return null;

    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      const dependencies = {...packageJson.dependencies, ...packageJson.devDependencies};

      const frameworkMap: Record<string, string> = {
        'jest': 'jest',
        'mocha': 'mocha',
        'jasmine': 'jasmine',
        'vitest': 'vitest',
        '@testing-library/react': 'react-testing'
      };

      for (const [pkg, framework] of Object.entries(frameworkMap)) {
        if (dependencies[pkg]) return framework;
      }

      // 手动选择框架
      const frameworks = Object.values(frameworkMap);
      return await vscode.window.showQuickPick(frameworks, {
        placeHolder: '请选择测试框架'
      }) || null;
    } catch (error) {
      console.error('检测测试框架失败:', error);
      return null;
    }
  }

  // 创建测试文件
  static createTestFile(sourcePath: string, framework: string): string {
    const sourceDir = path.dirname(sourcePath);
    const testDir = path.join(sourceDir, '__tests__');
    const fileName = path.basename(sourcePath);

    // 定义测试文件后缀名规则
    const testExtensions: Record<string, string> = {
      'jest': 'test',
      'mocha': 'spec',
      'jasmine': 'spec',
      'vitest': 'test',
      'react-testing': 'test'
    };

    const extension = testExtensions[framework] || 'test';
    const testFileName = fileName.replace(/(\.\w+)$/, `.${extension}$1`);

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    return path.join(testDir, testFileName);
  }

  // 生成测试代码
  static async generateTests(
    codeBlocks: string[],
    framework: string
  ): Promise<string> {
    try {
      // 开发模式下使用模拟数据
      if (process.env.NODE_ENV === 'development' && !process.env.USE_AI) {
        return this.mockGeneration(codeBlocks, framework);
      }

      const languageId = vscode.window.activeTextEditor?.document.languageId || 'javascript';
      const prompt = this.buildAIPrompt(codeBlocks, framework, languageId);

      return await generateWithAI(prompt);
    } catch (error) {
      throw new Error(`AI生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // 开发模式下的模拟生成
  private static mockGeneration(codeBlocks: string[], framework: string): string {
    const now = new Date().toISOString();
    const frameworkSpecific = this.getFrameworkSpecificCode(framework);

    return `
// 由 AutoTest Pilot 生成的测试代码
// 框架: ${framework}
// 时间: ${now}
// 这是开发模式下的模拟测试代码

${frameworkSpecific}

describe("自动生成的测试套件", () => {
  it("应该返回正确结果", () => {
    // 测试逻辑位于此处
    ${framework === 'jest' ? 'expect(true).toBe(true);' : 'assert.strictEqual(true, true);'}
  });

  it("应该处理边界情况", () => {
    // 边界测试逻辑
    ${framework === 'jest' ? 'expect(1 + 1).toBe(2);' : 'assert.strictEqual(1 + 1, 2);'}
  });
});
`;
  }

  // 获取特定框架的导入代码
  private static getFrameworkSpecificCode(framework: string): string {
    switch (framework) {
      case 'jest':
        return '// Jest 不需要额外导入断言库';
      case 'mocha':
        return 'const assert = require("assert");';
      case 'jasmine':
        return '// Jasmine 不需要额外导入断言库';
      case 'vitest':
        return 'import { expect, test } from "vitest";';
      case 'react-testing':
        return 'import { render, screen } from "@testing-library/react";\nimport userEvent from "@testing-library/user-event";';
      default:
        return '// 未知测试框架';
    }
  }

  // 构建AI提示词
  private static buildAIPrompt(
    codeBlocks: string[],
    framework: string,
    language: string
  ): string {
    return `
你是一个专业的${framework}测试工程师。基于以下代码：
${codeBlocks.map((code, i) => `\n### Block ${i+1}\n\`\`\`${language}\n${code}\n\`\`\``).join('\n')}

请生成：
1. 完整的测试套件，包含多个test case
2. 覆盖所有边界条件和异常情况
3. 使用${framework}最佳实践
4. 包含必要的mock和setup
5. 测试输出应为纯代码，无额外解释`;
  }
}