import WebSocket from 'ws';
import { AIService } from './ai-service/ai-openai';

export class WebSocketService {
  private wss: WebSocket.Server;
  private aiService: AIService;
  private port: number;

  constructor(port: number = 3001) {
    this.port = port;
    this.wss = new WebSocket.Server({ port });
    this.aiService = new AIService();

    this.init();
  }

  private init() {
    this.wss.on('connection', (ws) => {
      console.log('WebSocket连接已建立');

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());

          // 处理不同类型的消息
          switch (data.type) {
            case 'chat':
              this.handleChatMessage(ws, data);
              break;

            case 'ping':
              ws.send(JSON.stringify({ type: 'pong', time: Date.now() }));
              break;

            default:
              ws.send(JSON.stringify({
                type: 'error',
                message: '未知的消息类型'
              }));
          }
        } catch (error: any) {
          console.error('WebSocket处理错误:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: `消息处理失败: ${error.message}`
          }));
        }
      });

      ws.on('close', () => {
        console.log('WebSocket连接已关闭');
      });

      ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
      });
    });

    console.log(`WebSocket服务已启动，监听端口: ${this.port}`);
  }

  /**
   * 处理聊天消息
   */
  private async handleChatMessage(ws: WebSocket, data: any) {
    const { message, history } = data;

    try {
      // 获取流式响应
      const stream = await this.aiService.streamChat(message, history);

      // 将响应推送给客户端
      stream.on('data', (chunk) => {
        ws.send(JSON.stringify({
          type: 'chat_response',
          content: chunk.toString()
        }));
      });

      stream.on('end', () => {
        ws.send(JSON.stringify({
          type: 'chat_end'
        }));
      });

      stream.on('error', (err) => {
        console.error('Stream error:', err);
        ws.send(JSON.stringify({
          type: 'error',
          message: err.message
        }));
      });
    } catch (error: any) {
      ws.send(JSON.stringify({
        type: 'error',
        message: `AI处理失败: ${error.message}`
      }));
    }
  }
}