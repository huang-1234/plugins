import * as vscode from 'vscode';
import Anthropic from '@anthropic-ai/sdk';

// 获取API密钥
function getApiKey(): string | undefined {
  return vscode.workspace.getConfiguration('autotest').get('aiApiKey') as string | undefined;
}

// 使用AI生成测试代码
export async function generateWithAI(prompt: string): Promise<string> {
  const API_KEY = getApiKey();

  if (!API_KEY) {
    // 如果未配置API密钥，提示用户配置
    const configNow = await vscode.window.showInformationMessage(
      '未配置AI API密钥，需要配置才能生成测试',
      '现在配置',
      '取消'
    );

    if (configNow === '现在配置') {
      const apiKey = await vscode.window.showInputBox({
        prompt: '请输入Anthropic API密钥',
        password: true
      });

      if (apiKey) {
        await vscode.workspace.getConfiguration('autotest').update('aiApiKey', apiKey, vscode.ConfigurationTarget.Global);
        return generateWithAI(prompt); // 重新调用
      }
    }

    throw new Error('未配置AI API密钥');
  }

  try {
    const anthropic = new Anthropic({ apiKey: API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // 提取纯代码块
    const content = message.content[0].text;
    const codeBlockRegex = /```[a-z]*\n([\s\S]*?)```/;
    const match = content.match(codeBlockRegex);

    return match ? match[1] : content;
  } catch (error) {
    console.error('AI请求失败:', error);
    throw new Error(`AI请求失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 使用缓存优化生成性能
const testGenerationCache = new Map<string, string>();

export async function generateWithCache(code: string, framework: string, prompt: string): Promise<string> {
  const cacheKey = `${framework}-${hashString(code)}`;

  if (testGenerationCache.has(cacheKey)) {
    return testGenerationCache.get(cacheKey) as string;
  }

  const result = await generateWithAI(prompt);
  testGenerationCache.set(cacheKey, result);

  return result;
}

// 简单的字符串哈希函数
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return hash.toString(16);
}