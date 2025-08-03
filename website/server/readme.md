# Website Server

A backend service for the project website, built with Koa and TypeScript. This server provides API endpoints for document management, file uploads, AI integration, and real-time communication.

## Architecture

The server follows a modular architecture with the following components:

```
server/
├── src/                 # Source code
│   ├── db/              # Database and data storage
│   │   └── docs/        # Markdown documents
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic services
│   ├── swagger/         # API documentation
│   └── index.ts         # Main application entry point
├── content/             # Content files (markdown, etc.)
├── public/              # Static files
├── uploads/             # Uploaded files storage
└── package.json         # Project dependencies
```

## Technology Stack

- **Framework**: Koa 2.16.2
- **Language**: TypeScript 5.8.3
- **API Documentation**: Swagger (swagger-jsdoc, koa2-swagger-ui)
- **Authentication**: JWT (koa-jwt)
- **AI Integration**: LangChain, OpenAI
- **Real-time Communication**: Server-Sent Events (SSE)
- **File Handling**: File chunking and merging for large file uploads

## API Endpoints

### Document Management (`/api/docs`)

- `GET /api/docs`: Get a list of all available documents
- `GET /api/docs/list`: Get a list of document filenames
- `GET /api/docs/:name`: Get a specific document by name

### File Management (`/api/upload`)

- `POST /api/upload`: Upload a file chunk
- `POST /api/upload/merge`: Merge uploaded file chunks
- `POST /api/upload/check`: Check if a file already exists by hash
- `GET /api/upload/:key`: Download a file by key

### AI Services (`/api/ai`)

- `POST /api/ai/chat`: Send a message to the AI and get a response
- `POST /api/ai/stream`: Stream AI responses in real-time
- `POST /api/ai/search`: Search for information using AI

### Real-time Updates (`/sse`)

- `GET /api/sse`: Connect to Server-Sent Events for real-time updates

## Authentication

The server uses JWT (JSON Web Token) for authentication. Most endpoints require a valid JWT token in the Authorization header, except for the documentation and swagger endpoints which are publicly accessible.

```javascript
// JWT configuration
app.use(jwt({
  secret: process.env.JWT_SECRET || 'default_secret',
  passthrough: true
}).unless({ path: [/^\/docs/, /^\/swagger/, /^\/swagger.json/] }));
```

## Swagger UI

The API documentation is available through Swagger UI, which provides an interactive interface to explore and test the API endpoints.

- **URL**: `http://localhost:7788/swagger`
- **JSON Spec**: `http://localhost:7788/swagger.json`

The Swagger documentation is generated from JSDoc comments in the route files, making it easy to keep the API documentation up to date with the code.

## Server-Sent Events (SSE)

The server implements SSE for real-time communication with clients. This allows the server to push updates to connected clients without requiring polling.

```javascript
// SSE endpoint
router.get('/sse', async (ctx) => {
  ctx.set('Content-Type', 'text/event-stream');
  ctx.set('Cache-Control', 'no-cache');
  ctx.set('Connection', 'keep-alive');

  // Keep connection alive
  ctx.req.socket.setTimeout(0);
  ctx.req.socket.setNoDelay(true);
  ctx.req.socket.setKeepAlive(true);

  // Send events to the client
  const sendEvent = (data: any) => {
    ctx.res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Example: Send system status every 5 seconds
  const intervalId = setInterval(() => {
    const status = systemService.getSystemStatus();
    sendEvent({ type: 'status', data: status, time: Date.now() });
  }, 5000);

  // Clean up on disconnect
  ctx.req.on('close', () => {
    clearInterval(intervalId);
  });
});
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm (v10+)

### Installation

```bash
# Install dependencies
pnpm install
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=7788
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_api_key
```

### Development

```bash
# Start development server with hot-reload
pnpm dev
```

### Production Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## API Testing

You can test the API endpoints using the Swagger UI or with tools like curl or Postman.

### Example: Get Document List

```bash
curl -X GET http://localhost:7788/api/docs
```

### Example: Upload File Chunk

```bash
curl -X POST http://localhost:7788/api/upload \
  -H "Content-Type: multipart/form-data" \
  -H "Content-Range: bytes 0-1048575/3145728" \
  -F "file=@chunk1.dat" \
  -F "hash=file_hash_value" \
  -F "index=0"
```

### Example: AI Chat

```bash
curl -X POST http://localhost:7788/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{"message": "Hello, AI!", "history": []}'
```

## Error Handling

The server implements centralized error handling to ensure consistent error responses across all endpoints:

```javascript
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      message: err.message || 'Internal server error'
    };
    console.error(`[Error] ${err.message}`, err.stack);
  }
});
```

## Port Management

The server automatically finds an available port starting from the configured port (default: 7788):

```javascript
const findAvailablePort = async (startPort: number): Promise<number> => {
  const net = require('net');
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    let port = startPort;
    server.on('error', () => {
      port++;
      server.listen(port);
    });
    server.on('listening', () => {
      server.close(() => {
        resolve(port);
      });
    });
    server.listen(port);
  });
};
```
