import { Readable } from 'stream';

/**
 * AI服务基类
 */
export abstract class AIServiceBase {
  /**
   * 处理AI聊天请求
   * @param message 用户消息
   * @param history 历史消息
   */
  abstract processChat(
    message: string,
    history?: Array<{ role: string, content: string }>
  ): Promise<{ content: string, id?: string, model?: string }>;

  /**
   * 处理流式AI聊天请求
   * @param message 用户消息
   * @param history 历史消息
   */
  abstract streamChat(
    message: string,
    history?: Array<{ role: string, content: string }>
  ): Promise<Readable>;
}