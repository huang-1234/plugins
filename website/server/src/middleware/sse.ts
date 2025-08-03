/**
 * 编写一个基于 koa 的 sse 中间件
 */

// src/middleware/sse.ts
import { Context, Next } from 'koa';
import { PassThrough } from 'stream';

// SSE 客户端类型定义
type SSEClient = {
  id: string;
  stream: PassThrough;
  ip: string;
  userAgent?: string;
  metadata?: Record<string, any>;
};

// SSE 消息格式
export type SSEMessage = {
  id?: string;       // 消息ID（用于客户端重新连接时追踪）
  event?: string;    // 事件名称（客户端通过 addEventListener 监听）
  data: any;         // 要发送的数据（字符串或可序列化对象）
  retry?: number;    // 客户端断开后重连间隔（毫秒）
};

// SSE 中间件选项
export type SSEOptions = {
  path?: string;                  // 监听的路由路径（默认 '/sse'）
  keepAliveInterval?: number;     // 心跳间隔（默认 30000 毫秒）
  clientTimeout?: number;          // 客户端不活动超时（默认 300000 毫秒）
  maxClients?: number;             // 最大客户端数（默认无限制）
  compression?: boolean;           // 是否启用压缩（默认 false）
  onConnect?: (client: SSEClient) => void; // 客户端连接回调
  onDisconnect?: (client: SSEClient) => void; // 客户端断开回调
};

// 默认配置
const DEFAULT_OPTIONS: Required<SSEOptions> = {
  path: '/sse',
  keepAliveInterval: 30000,
  clientTimeout: 300000,
  maxClients: Infinity,
  compression: false,
  onConnect: () => {},
  onDisconnect: () => {},
};

// SSE 中间件实现
export const sseMiddleware = (userOptions: SSEOptions = {}) => {
  const options: Required<SSEOptions> = { ...DEFAULT_OPTIONS, ...userOptions };

  // 存储所有连接的客户端
  const clients = new Map<string, SSEClient>();

  // 生成唯一的客户端ID
  const generateClientId = () => {
    return `client-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  };

  // 广播消息给所有客户端
  const broadcast = (message: SSEMessage) => {
    clients.forEach(client => send(client.stream, message));
  };

  // 给特定客户端发送消息
  const sendToClient = (clientId: string, message: SSEMessage) => {
    const client = clients.get(clientId);
    if (client) {
      send(client.stream, message);
    }
  };

  // 发送 SSE 消息的核心方法
  const send = (stream: PassThrough, { id, event, data, retry }: SSEMessage) => {
    if (id) stream.write(`id: ${id}\n`);
    if (event) stream.write(`event: ${event}\n`);
    if (retry) stream.write(`retry: ${retry}\n`);

    // 数据序列化
    const payload = typeof data === 'string' ? data : JSON.stringify(data);

    // 分割为多行
    payload.split('\n').forEach(line => {
      stream.write(`data: ${line}\n`);
    });

    stream.write('\n');
  };

  // 心跳检测
  let heartbeatInterval: NodeJS.Timeout;
  const startHeartbeat = () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);

    heartbeatInterval = setInterval(() => {
      broadcast({
        event: 'heartbeat',
        data: { timestamp: Date.now() },
        retry: options.keepAliveInterval
      });
    }, options.keepAliveInterval);
  };

  // 连接清理（超时）
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    clients.forEach((client, id) => {
      if (client.stream.destroyed ||
          now - parseInt(id.split('-')[1]) > options.clientTimeout) {
        client.stream.destroy();
        clients.delete(id);
        options.onDisconnect(client);
      }
    });
  }, 10000);

  // 关闭所有客户端连接（用于服务器关闭时）
  const closeAllClients = () => {
    clients.forEach(client => client.stream.destroy());
    clients.clear();
    clearInterval(heartbeatInterval);
    clearInterval(cleanupInterval);
  };

  // 中间件函数
  return async (ctx: Context, next: Next) => {
    // 只处理特定路径的请求
    if (ctx.path !== options.path) {
      return next();
    }

    // 检查是否超过最大客户端数
    if (clients.size >= options.maxClients) {
      ctx.status = 503; // 服务不可用
      ctx.body = { error: 'Server busy. Too many SSE connections.' };
      return;
    }

    // 设置 SSE 响应头
    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // 禁用 Nginx 代理缓存
    });

    // 压缩支持（如果需要）
    if (options.compression && ctx.compress) {
      ctx.compress = true;
    }

    // 配置 socket
    ctx.req.socket.setTimeout(0);
    ctx.req.socket.setNoDelay(true);
    ctx.req.socket.setKeepAlive(true);

    // 创建传输流
    const stream = new PassThrough();
    const clientId = generateClientId();

    // 创建客户端对象
    const client: SSEClient = {
      id: clientId,
      stream,
      ip: ctx.ip,
      userAgent: ctx.get('User-Agent'),
    };

    // 添加元数据（如果存在）
    if (ctx.state.user) {
      client.metadata = {
        userId: ctx.state.user.id,
        role: ctx.state.user.role
      };
    }

    // 保存客户端
    clients.set(clientId, client);

    // 触发连接回调
    options.onConnect(client);

    // 启动心跳（如果是第一个客户端）
    if (clients.size === 1) {
      startHeartbeat();
    }

    // 客户端断开处理
    const handleDisconnect = () => {
      clients.delete(clientId);
      options.onDisconnect(client);

      // 如果没有客户端了，停止心跳
      if (clients.size === 0) {
        clearInterval(heartbeatInterval);
      }
    };

    // 监听断开事件
    ctx.req.on('close', handleDisconnect);
    ctx.req.on('end', handleDisconnect);
    ctx.req.on('error', handleDisconnect);

    // 发送初始连接消息
    send(stream, {
      id: 'init',
      event: 'connected',
      data: {
        message: 'SSE connection established',
        clientId,
        timestamp: new Date().toISOString()
      }
    });

    // 设置响应体
    ctx.body = stream;

    // 暴露 SSE 功能到上下文
    ctx.sse = {
      broadcast,
      send: (message: SSEMessage) => send(stream, message),
      sendToClient: (targetId: string, message: SSEMessage) => sendToClient(targetId, message),
      clients: () => Array.from(clients.values()),
      getClient: (id: string) => clients.get(id),
      closeAll: closeAllClients
    };
  };
};

// 扩展 Koa 上下文类型
declare module 'koa' {
  interface Context {
    sse?: {
      broadcast: (message: SSEMessage) => void;
      send: (message: SSEMessage) => void;
      sendToClient: (clientId: string, message: SSEMessage) => void;
      clients: () => SSEClient[];
      getClient: (id: string) => SSEClient | undefined;
      closeAll: () => void;
    };
  }
}