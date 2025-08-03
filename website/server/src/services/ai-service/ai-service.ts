// 基于base的实现
import { AIServiceBase } from "./base";
import OpenAI from "openai";
import { Readable } from 'stream';

export class AIService extends AIServiceBase {
  private openai: OpenAI | null = null;

  constructor() {
    super();
    // 延迟初始化OpenAI客户端，避免在没有API密钥时立即抛出错误
  }

  /**
   * 获取OpenAI客户端实例
   */
  private getClient(): OpenAI {
    if (!this.openai) {
      const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_KEY;

      if (!apiKey) {
        throw new Error('未配置API密钥，请设置DASHSCOPE_API_KEY或OPENAI_KEY环境变量');
      }

      this.openai = new OpenAI({
        apiKey,
        baseURL: process.env.DASHSCOPE_API_KEY
          ? "https://dashscope.aliyuncs.com/compatible-mode/v1"
          : undefined // 如果使用OPENAI_KEY则使用默认baseURL
      });
    }
    return this.openai;
  }

  /**
   * 处理AI聊天请求
   */
  async processChat(message: string, history: Array<{ role: string, content: string }> = []) {
    try {
      const client = this.getClient();

      const messages = [
        { role: "system" as const, content: "You are a helpful assistant." },
        ...history.map(msg => ({
          role: msg.role as "system" | "user" | "assistant",
          content: msg.content
        })),
        { role: "user" as const, content: message }
      ];

      const completion = await client.chat.completions.create({
        model: process.env.DASHSCOPE_API_KEY ? "qwen-plus" : "gpt-4o-mini",
        messages
      });

      return {
        content: completion.choices[0]?.message?.content || '',
        id: completion.id,
        model: completion.model
      };
    } catch (error: any) {
      console.error('AI处理错误:', error);
      throw new Error(`AI处理失败: ${error.message}`);
    }
  }

  /**
   * 处理流式AI聊天请求
   */
  async streamChat(message: string, history: Array<{ role: string, content: string }> = []): Promise<Readable> {
    try {
      const client = this.getClient();

      // 创建一个可读流
      const outputStream = new Readable({
        read() {} // 实现必要的read方法
      });

      const messages = [
        { role: "system" as const, content: "You are a helpful assistant." },
        ...history.map(msg => ({
          role: msg.role as "system" | "user" | "assistant",
          content: msg.content
        })),
        { role: "user" as const, content: message }
      ];

      // 执行流式处理
      const stream = await client.chat.completions.create({
        model: process.env.DASHSCOPE_API_KEY ? "qwen-plus" : "gpt-4o-mini",
        messages,
        stream: true,
      });

      // 处理流数据
      (async () => {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              outputStream.push(content);
            }
          }
          outputStream.push(null); // 表示流结束
        } catch (error) {
          console.error('流处理错误:', error);
          outputStream.destroy(error instanceof Error ? error : new Error(String(error)));
        }
      })();

      return outputStream;
    } catch (error: any) {
      console.error('AI流处理错误:', error);
      throw new Error(`AI流处理失败: ${error.message}`);
    }
  }
}