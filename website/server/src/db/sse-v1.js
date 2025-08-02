export const sseV1 = {
  data: {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    content: `# 基于流的 Koa SSE 中间件实现

下面是一个优化后的基于流的 SSE 中间件实现，包含完整的类型定义和高级功能：

\`\`\`typescript
// src/middleware/sse.ts
import { Context, Next } from 'koa';
    import { PassThrough } from 'stream';

    // SSE 客户端类型定义
    type SSEClient = {
      id: string;
      stream: PassThrough;
      ip: string;
      userAgent?: string;
      metadata?: Record < string, any>;
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
    onConnect: () => { },
      onDisconnect: () => { },
};

// SSE 中间件实现
export const sseMiddleware = (userOptions: SSEOptions = {}) => {
  const options: Required<SSEOptions> = { ...DEFAULT_OPTIONS, ...userOptions };

  // 存储所有连接的客户端
  const clients = new Map < string, SSEClient> ();

  // 生成唯一的客户端ID
  const generateClientId = () => {
    return \`client-${Date.now()}-${Math.random().toString(36).substring(2, 10)}\`;
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
    if (id) stream.write(\`id: ${id}\n\`);
    if (event) stream.write(\`event: ${event}\n\`);
    if (retry) stream.write(\`retry: ${retry}\n\`);

    // 数据序列化
    const payload = typeof data === 'string' ? data : JSON.stringify(data);

    // 分割为多行
    payload.split('\n').forEach(line => {
      stream.write(\`data: ${line}\n\`);
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
\`\`\`

## 使用示例

### 基本用法

\`\`\`typescript
// app.ts
import Koa from 'koa';
import { sseMiddleware } from './middleware/sse';

const app = new Koa();

// 使用 SSE 中间件
app.use(sseMiddleware({
  path: '/events', // 自定义路径
  keepAliveInterval: 15000, // 15秒心跳
}));

// 其他路由
app.use(async (ctx, next) => {
  if (ctx.path === '/broadcast') {
    if (!ctx.sse) {
      ctx.status = 400;
      ctx.body = { error: 'SSE not initialized' };
      return;
    }

    // 广播消息给所有客户端
    ctx.sse.broadcast({
      event: 'system-message',
      data: {
        message: 'System maintenance scheduled for tonight'
      }
    });

    ctx.body = { success: true };
    return;
  }

  await next();
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
\`\`\`

### 高级用法 - 实时通知服务

\`\`\`typescript
// notifications.ts
import Koa from 'koa';
import Router from '@koa/router';
import { sseMiddleware, SSEMessage } from './middleware/sse';

const app = new Koa();
const router = new Router();

// 配置 SSE 中间件（带事件回调）
app.use(sseMiddleware({
  onConnect: (client) => {
    console.log(\`Client connected: ${client.id} (IP: ${client.ip})\`);
  },
  onDisconnect: (client) => {
    console.log(\`Client disconnected: ${client.id}\`);
  }
}));

// 发送个人通知的路由
router.post('/notify/:userId', async (ctx) => {
  const userId = ctx.params.userId;

  if (!ctx.sse) {
    ctx.status = 500;
    ctx.body = { error: 'SSE not available' };
    return;
  }

  // 查找特定用户的 SSE 连接
  const clients = ctx.sse.clients();
  const userClient = clients.find(c => c.metadata?.userId === userId);

  if (!userClient) {
    ctx.status = 404;
    ctx.body = { error: 'User not connected via SSE' };
    return;
  }

  // 给该用户发送通知
  const message: SSEMessage = {
    event: 'personal-notification',
    data: {
      title: 'New Message',
      content: 'You have a new message from the admin',
      timestamp: new Date().toISOString()
    }
  };

  ctx.sse.sendToClient(userClient.id, message);

  ctx.body = { success: true };
});

// 广播系统通知
router.post('/broadcast', async (ctx) => {
  if (!ctx.sse) {
    ctx.status = 500;
    ctx.body = { error: 'SSE not available' };
    return;
  }

  const { message } = ctx.request.body as { message: string };

  ctx.sse.broadcast({
    event: 'system-notification',
    data: {
      title: 'System Broadcast',
      content: message,
      timestamp: new Date().toISOString()
    }
  });

  ctx.body = { success: true };
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3001, () => {
  console.log('Notification service running on http://localhost:3001');
});
\`\`\`

### 前端连接示例

\`\`\`html
  < !DOCTYPE html >
    <html>
      <head>
        <title>SSE Client</title>
      </head>
      <body>
        <h1>Server-Sent Events Demo</h1>
        <div id="messages"></div>

        <script>
          const clientId = localStorage.getItem('sseClientId') || \`web-${Date.now()}\`;
          localStorage.setItem('sseClientId', clientId);

          // 建立 SSE 连接
          const eventSource = new EventSource(\`/events?clientId=${clientId}\`);

    eventSource.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data);
          console.log('Connected with ID:', data.clientId);

          if (data.clientId !== clientId) {
            localStorage.setItem('sseClientId', data.clientId);
      }
    });

    eventSource.addEventListener('personal-notification', (event) => {
      const message = JSON.parse(event.data);
          displayMessage('Personal', message);
    });

    eventSource.addEventListener('system-notification', (event) => {
      const message = JSON.parse(event.data);
          displayMessage('System', message);
    });

    eventSource.addEventListener('heartbeat', () => {
            console.log('Heartbeat received');
    });

    eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
      setTimeout(() => {
            location.reload(); // 尝试重新连接
      }, 3000);
    };

          function displayMessage(type, {title, content, timestamp}) {
      const messagesDiv = document.getElementById('messages');
          const messageEl = document.createElement('div');
          messageEl.innerHTML = \`
          <h3>[${type}] ${title}</h3>
          <p>${content}</p>
          <small>${new Date(timestamp).toLocaleString()}</small>
          <hr>
            \`
            messagesDiv.prepend(messageEl);
    }
        </script>
      </body>
    </html>
\`\`\`

## 功能特点

1. **完善的类型支持**
   - 完整的 TypeScript 类型定义
   - Koa 上下文扩展支持
   - 强类型的消息格式

2. **客户端管理**
   - 自动生成唯一客户端 ID
   - 客户端元数据支持（如用户信息）
   - 客户端超时检测和自动清理
   - 最大客户端数限制

3. **消息功能**
   - 广播消息到所有客户端
   - 定向消息到特定客户端
   - 支持自定义事件类型
   - 支持重试间隔设置

4. **可靠性保障**
   - 自动心跳检测
   - 客户端断开自动清理
   - 连接超时处理
   - 压缩支持

5. **扩展性**
   - 连接/断开事件回调
   - 自定义路径配置
   - 多服务器场景支持
   - 客户端管理API公开

6. **安全考虑**
   - 最大连接数限制
   - IP 和 User-Agent 记录
   - 心跳检测保活
   - 防止代理缓冲

这个中间件适用于各种实时场景，包括：
- 实时通知系统
- 实时数据看板
- 在线协作编辑
- 实时聊天应用
- 股票市场实时报价
- 游戏状态同步

在性能上，该中间件：
1. 使用流式处理避免内存溢出
2. 客户端管理轻量高效
3. 支持大并发连接
4. 心跳检测优化减少带宽占用
5. 客户端超时自动清理释放资源

可以根据具体需求调整配置参数，平衡实时性、性能和资源消耗。`
  }
};