// 测试结果类型
export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  message?: string;
  duration?: number;
}

// 测试套件类型
export interface TestSuite {
  name: string;
  tests: TestResult[];
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
}

// 测试框架类型
export type TestFramework = 'jest' | 'mocha' | 'vitest' | 'jasmine' | 'react-testing';

// AI生成请求类型
export interface AIGenerateRequest {
  code: string;
  framework: TestFramework;
  language: string;
}

// AI生成响应类型
export interface AIGenerateResponse {
  testCode: string;
  suggestions?: string[];
}

// 测试修复请求类型
export interface TestFixRequest {
  testCode: string;
  testOutput: string;
  framework: TestFramework;
}

// 测试修复响应类型
export interface TestFixResponse {
  fixedCode: string;
  explanation?: string;
}