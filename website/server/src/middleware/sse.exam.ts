/**
 * 编写一个基于 koa 的 sse 中间件
 *
 * 1. 创建一个 Koa 应用
 * 2. 创建一个 Router
 * 3. 创建一个 SSE 客户端管理
 * 4. 创建一个中间件：处理 SSE 连接
 * 5. 创建一个辅助函数：发送 SSE 消息
 * 6. 创建一个数据生成器
 * 7. 创建一个广播消息的函数
 * 8. 创建一个启动数据模拟器的函数
 * 9. 创建一个测试路由
 * 10. 注册路由
 * 11. 启动服务
 */
import Koa from 'koa';
import Router from 'koa-router';
import { PassThrough } from 'stream';

// 创建 Koa 应用
const app = new Koa();
const router = new Router();

// SSE 事件类型
type SSEData = {
  id?: string;
  event?: string;
  data: any;
  retry?: number;
};

// SSE 客户端管理
const sseClients = new Set<PassThrough>();

// 中间件：处理 SSE 连接
app.use(async (ctx, next) => {
  if (ctx.path === '/sse') {
    ctx.request.socket.setTimeout(0);
    ctx.req.socket.setNoDelay(true);
    ctx.req.socket.setKeepAlive(true);

    ctx.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const stream = new PassThrough();
    sseClients.add(stream);
    ctx.body = stream;

    // 客户端断开连接时清理
    ctx.req.on('close', () => {
      sseClients.delete(stream);
      console.log('SSE client disconnected');
    });

    ctx.req.on('end', () => {
      sseClients.delete(stream);
      console.log('SSE client ended');
    });

    // 发送初始连接消息
    sendSSE(stream, {
      event: 'connected',
      data: { message: 'SSE connection established', timestamp: new Date().toISOString() }
    });
  } else {
    await next();
  }
});

// 发送 SSE 消息的辅助函数
function sendSSE(stream: PassThrough, sseData: SSEData) {
  const { id, event, data, retry } = sseData;

  if (id) stream.write(`id: ${id}\n`);
  if (event) stream.write(`event: ${event}\n`);
  if (retry) stream.write(`retry: ${retry}\n`);

  // 确保数据是字符串格式
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  payload.split('\n').forEach(line => {
    stream.write(`data: ${line}\n`);
  });

  stream.write('\n');
}

// 模拟数据生成器
class DataGenerator {
  // 模拟实时股票数据
  static generateStockData() {
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const price = (Math.random() * 1000).toFixed(2);
    const change = (Math.random() * 10 - 5).toFixed(2);

    return {
      symbol,
      price: parseFloat(price),
      change: parseFloat(change),
      volume: Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString()
    };
  }

  // 模拟实时天气数据
  static generateWeatherData() {
    const cities = ['New York', 'London', 'Tokyo', 'Sydney', 'Berlin'];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const temp = (Math.random() * 40 - 10).toFixed(1);
    const humidity = Math.floor(Math.random() * 100);

    return {
      city,
      temperature: parseFloat(temp),
      humidity,
      conditions: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
      timestamp: new Date().toISOString()
    };
  }

  // 模拟实时用户活动
  static generateUserActivity() {
    const actions = ['login', 'logout', 'purchase', 'view', 'search'];
    const userId = `user-${Math.floor(Math.random() * 1000)}`;
    const action = actions[Math.floor(Math.random() * actions.length)];

    return {
      userId,
      action,
      details: `${userId} performed ${action} action`,
      timestamp: new Date().toISOString()
    };
  }

  // 模拟系统监控数据
  static generateSystemMetrics() {
    return {
      cpu: (Math.random() * 100).toFixed(1),
      memory: (Math.random() * 100).toFixed(1),
      disk: (Math.random() * 100).toFixed(1),
      networkIn: (Math.random() * 100).toFixed(1),
      networkOut: (Math.random() * 100).toFixed(1),
      timestamp: new Date().toISOString()
    };
  }
}

// 广播消息给所有连接的客户端
function broadcastSSE(sseData: SSEData) {
  sseClients.forEach(client => {
    sendSSE(client, sseData);
  });
}

// 启动数据模拟器
function startDataSimulation() {
  // 股票数据模拟（每2秒）
  setInterval(() => {
    const stockData = DataGenerator.generateStockData();
    broadcastSSE({
      event: 'stock',
      data: stockData
    });
  }, 2000);

  // 天气数据模拟（每5秒）
  setInterval(() => {
    const weatherData = DataGenerator.generateWeatherData();
    broadcastSSE({
      event: 'weather',
      data: weatherData
    });
  }, 5000);

  // 用户活动模拟（每1秒）
  setInterval(() => {
    const userActivity = DataGenerator.generateUserActivity();
    broadcastSSE({
      event: 'activity',
      data: userActivity
    });
  }, 1000);

  // 系统监控模拟（每3秒）
  setInterval(() => {
    const metrics = DataGenerator.generateSystemMetrics();
    broadcastSSE({
      event: 'metrics',
      data: metrics
    });
  }, 3000);

  // 心跳检测（每30秒）
  setInterval(() => {
    broadcastSSE({
      event: 'heartbeat',
      data: { message: 'SSE connection alive', timestamp: new Date().toISOString() }
    });
  }, 30000);
}

// 添加测试路由
router.get('/', (ctx) => {
  ctx.body = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SSE Demo</title>
      <style>
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .panel { border: 1px solid #ddd; border-radius: 5px; padding: 15px; }
        h2 { margin-top: 0; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow: auto; }
      </style>
    </head>
    <body>
      <h1>Server-Sent Events (SSE) Demo</h1>
      <div class="container">
        <div class="panel">
          <h2>Stock Data</h2>
          <pre id="stock"></pre>
        </div>
        <div class="panel">
          <h2>Weather Data</h2>
          <pre id="weather"></pre>
        </div>
        <div class="panel">
          <h2>User Activity</h2>
          <pre id="activity"></pre>
        </div>
        <div class="panel">
          <h2>System Metrics</h2>
          <pre id="metrics"></pre>
        </div>
      </div>

      <script>
        const eventSource = new EventSource('/sse');

        eventSource.addEventListener('stock', (event) => {
          document.getElementById('stock').textContent = JSON.stringify(JSON.parse(event.data), null, 2);
        });

        eventSource.addEventListener('weather', (event) => {
          document.getElementById('weather').textContent = JSON.stringify(JSON.parse(event.data), null, 2);
        });

        eventSource.addEventListener('activity', (event) => {
          document.getElementById('activity').textContent = JSON.stringify(JSON.parse(event.data), null, 2);
        });

        eventSource.addEventListener('metrics', (event) => {
          document.getElementById('metrics').textContent = JSON.stringify(JSON.parse(event.data), null, 2);
        });

        eventSource.addEventListener('heartbeat', (event) => {
          console.log('Heartbeat:', event.data);
        });

        eventSource.addEventListener('connected', (event) => {
          console.log('Connected:', event.data);
        });

        eventSource.onerror = (error) => {
          console.error('SSE Error:', error);
        };
      </script>
    </body>
    </html>
  `;
});

// 注册路由
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startDataSimulation();
  console.log('SSE data simulation started');
});