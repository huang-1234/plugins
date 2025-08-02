import { Readable } from 'stream';
import { LangChain } from 'langchain';

export class AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_KEY || '';
  }

  /**
   * 处理AI聊天请求
   */
  async processChat(message: string, history: Array<{ role: string, content: string }> = []) {
    if (!this.apiKey) {
      throw new Error('未配置OpenAI API密钥');
    }

    try {
      const model = new LangChain({
        apiKey: this.apiKey,
        streaming: false
      });

      const response = await model.call({
        messages: [
          ...history,
          { role: 'user', content: message }
        ]
      });

      return response;
    } catch (error: any) {
      console.error('AI处理错误:', error);
      throw new Error(`AI处理失败: ${error.message}`);
    }
  }

  /**
   * 处理流式AI聊天请求
   */
  async streamChat(message: string, history: Array<{ role: string, content: string }> = []): Promise<Readable> {
    if (!this.apiKey) {
      throw new Error('未配置OpenAI API密钥');
    }

    try {
      const model = new LangChain({
        apiKey: this.apiKey,
        streaming: true
      });

      const stream = await model.streamCall({
        messages: [
          ...history,
          { role: 'user', content: message }
        ]
      });

      return stream;
    } catch (error: any) {
      console.error('AI流处理错误:', error);
      throw new Error(`AI流处理失败: ${error.message}`);
    }
  }
}