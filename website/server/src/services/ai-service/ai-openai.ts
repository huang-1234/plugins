import { Readable } from 'stream';
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

/**
 * @description 处理AI聊天请求
 * @desc 设计成支持其他模型、 比如 deepseek
 * @desc 支持流式处理
 * @desc 支持上下文
 * @desc 支持历史消息
 * @desc 支持多轮对话
 * @desc 支持多语言
 */
export class AIService {
  private model: ChatOpenAI;

  constructor() {
    this.model = new ChatOpenAI({
      apiKey: process.env.OPENAI_KEY,
      model: "gpt-4o-mini",
      temperature: 0.8,
    });
  }

  /**
   * 处理AI聊天请求
   */
  async processChat(message: string, history: Array<{ role: string, content: string }> = []) {
    if (!process.env.OPENAI_KEY) {
      throw new Error('未配置OpenAI API密钥');
    }

    try {
      // 转换消息格式
      const messages = this.formatMessages(history, message);

      // 执行调用
      const response = await this.model.invoke(messages as any);

      return { content: response.content };
    } catch (error: any) {
      console.error('AI处理错误:', error);
      throw new Error(`AI处理失败: ${error.message}`);
    }
  }

  /**
   * 处理流式AI聊天请求
   */
  async streamChat(message: string, history: Array<{ role: string, content: string }> = []): Promise<Readable> {
    if (!process.env.OPENAI_KEY) {
      throw new Error('未配置OpenAI API密钥');
    }

    try {
      // 转换消息格式
      const messages = this.formatMessages(history, message);

      // 创建一个可读流
      const outputStream = new Readable({
        read() {} // 实现必要的read方法
      });

      // 执行流式处理
      const stream = await this.model.stream(messages as any);

      // 处理流数据
      (async () => {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              outputStream.push(chunk.content);
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

  /**
   * 将历史消息转换为LangChain消息格式
   */
  private formatMessages(history: Array<{ role: string, content: string }>, currentMessage: string) {
    const messages = history.map(msg => {
      switch (msg.role) {
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        case 'system':
          return new SystemMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });

    // 添加当前用户消息
    messages.push(new HumanMessage(currentMessage));

    return messages;
  }
}