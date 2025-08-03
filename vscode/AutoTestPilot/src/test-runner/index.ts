import * as vscode from 'vscode';
import * as path from 'path';
import * as child_process from 'child_process';
import { TestResult } from '../types';

export class TestRunner {
  // 运行测试
  static async runTests(
    testFilePath: string,
    framework: string
  ): Promise<string> {
    const runner = this.getRunner(testFilePath, framework);
    return runner.run();
  }

  // 获取合适的测试运行器
  private static getRunner(
    testFilePath: string,
    framework: string
  ): ITestRunner {
    const runners: Record<string, new (testFilePath: string) => ITestRunner> = {
      'jest': JestRunner,
      'mocha': MochaRunner,
      'vitest': VitestRunner,
      'jasmine': JasmineRunner,
      'react-testing': JestRunner // React Testing Library 通常与 Jest 一起使用
    };

    const RunnerClass = runners[framework] || DefaultRunner;
    return new RunnerClass(testFilePath);
  }

  // 显示测试结果
  static async displayTestResults(results: string, testFilePath: string): Promise<void> {
    // 创建或显示输出通道
    const outputChannel = vscode.window.createOutputChannel('AutoTest Pilot');
    outputChannel.clear();
    outputChannel.appendLine('测试结果:');
    outputChannel.appendLine('='.repeat(50));
    outputChannel.appendLine(results);
    outputChannel.appendLine('='.repeat(50));
    outputChannel.show();

    // 如果在开发模式下，可以使用更丰富的结果面板
    if (process.env.NODE_ENV === 'development') {
      try {
        const testPanel = await import('../ui/TestPanel');
        const panel = new testPanel.default(testFilePath, results);
        panel.show();
      } catch (error) {
        // 如果UI模块未实现，则忽略
        console.log('测试面板未实现，使用输出通道显示结果');
      }
    }
  }
}

// 测试运行器接口
interface ITestRunner {
  run(): Promise<string>;
  parseResults(rawOutput: string): TestResult[];
}

// 默认测试运行器（当无法确定框架时）
class DefaultRunner implements ITestRunner {
  protected testFilePath: string;

  constructor(testFilePath: string) {
    this.testFilePath = testFilePath;
  }

  async run(): Promise<string> {
    return `无法运行测试：未识别的测试框架\n测试文件: ${this.testFilePath}`;
  }

  parseResults(rawOutput: string): TestResult[] {
    return [];
  }
}

// Jest 测试运行器
class JestRunner implements ITestRunner {
  protected testFilePath: string;

  constructor(testFilePath: string) {
    this.testFilePath = testFilePath;
  }

  async run(): Promise<string> {
    return new Promise((resolve) => {
      // 检查是否全局安装了Jest
      const jestBin = this.findJestBinary();
      if (!jestBin) {
        resolve(`无法找到Jest。请确保已安装Jest (npm install -g jest 或在项目中安装)`);
        return;
      }

      // 使用Jest API运行测试
      const process = child_process.spawn(jestBin, [this.testFilePath, '--no-cache']);

      let output = '';
      process.stdout.on('data', (data) => output += data);
      process.stderr.on('data', (data) => output += data);

      process.on('close', () => resolve(output));
    });
  }

  parseResults(rawOutput: string): TestResult[] {
    // 实际实现中应该解析Jest输出格式
    return [];
  }

  private findJestBinary(): string | null {
    try {
      // 检查本地安装
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (workspaceRoot) {
        const localJest = path.join(workspaceRoot, 'node_modules', '.bin', 'jest');
        if (this.fileExists(localJest)) {
          return localJest;
        }
      }

      // 检查全局安装
      const globalJest = child_process.spawnSync('which', ['jest']).stdout?.toString().trim();
      if (globalJest && this.fileExists(globalJest)) {
        return globalJest;
      }

      // Windows环境
      const winJest = child_process.spawnSync('where', ['jest']).stdout?.toString().trim();
      if (winJest && this.fileExists(winJest)) {
        return winJest;
      }

      return null;
    } catch (error) {
      console.error('查找Jest失败:', error);
      return null;
    }
  }

  private fileExists(filePath: string): boolean {
    try {
      return require('fs').existsSync(filePath);
    } catch {
      return false;
    }
  }
}

// Mocha 测试运行器
class MochaRunner implements ITestRunner {
  protected testFilePath: string;

  constructor(testFilePath: string) {
    this.testFilePath = testFilePath;
  }

  async run(): Promise<string> {
    // 实现类似JestRunner的逻辑，但使用Mocha命令
    return `模拟Mocha测试运行\n测试文件: ${this.testFilePath}`;
  }

  parseResults(rawOutput: string): TestResult[] {
    return [];
  }
}

// Vitest 测试运行器
class VitestRunner implements ITestRunner {
  protected testFilePath: string;

  constructor(testFilePath: string) {
    this.testFilePath = testFilePath;
  }

  async run(): Promise<string> {
    // 实现类似JestRunner的逻辑，但使用Vitest命令
    return `模拟Vitest测试运行\n测试文件: ${this.testFilePath}`;
  }

  parseResults(rawOutput: string): TestResult[] {
    return [];
  }
}

// Jasmine 测试运行器
class JasmineRunner implements ITestRunner {
  protected testFilePath: string;

  constructor(testFilePath: string) {
    this.testFilePath = testFilePath;
  }

  async run(): Promise<string> {
    // 实现类似JestRunner的逻辑，但使用Jasmine命令
    return `模拟Jasmine测试运行\n测试文件: ${this.testFilePath}`;
  }

  parseResults(rawOutput: string): TestResult[] {
    return [];
  }
}