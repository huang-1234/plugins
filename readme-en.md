# AI Code Project Architecture Design and Functional Modules

## Project Overview

AI Code is a comprehensive frontend toolset project, consisting of multiple independent but interconnected modules, primarily focusing on performance monitoring, file processing, and visual workflow solutions. The project adopts a monorepo structure, using pnpm workspace for package management, ensuring clear and maintainable dependencies between modules.

## Technology Stack

- **Frontend Framework**: React 18.2.0, TypeScript 5.8.3
- **UI Components**: Ant Design 5.26.7
- **State Management**: Zustand 4.5.7, Immer 10.1.1
- **Build Tools**: Vite 5.4.19, Rollup 4.12.0
- **Package Management**: PNPM 10.13.1 (Workspace)
- **Testing Framework**: Vitest 3.2.4
- **Documentation Tool**: RSPress 1.44.0
- **Backend Framework**: Koa 2.16.2
- **AI Integration**: LangChain 0.0.140, OpenAI API

## Project Structure

```
/
├── libs/                  # Core libraries
│   ├── performance-monitor/  # Performance monitoring library
│   ├── files-buffer/         # Large file chunked upload library
│   └── examples/             # Example code
├── chrome/                # Browser extensions
│   └── performance/       # Performance monitoring extension
├── website/               # Project website
│   ├── web/               # Frontend
│   └── server/            # Backend
├── vscode/                # VSCode extension
├── tech/                  # Technical documentation
└── package.json           # Root project configuration
```

## Core Modules

### 1. Performance Monitoring Library (perfor-monitor)

Location: `/libs/performance-monitor`

Features:
- Monitor core Web Vitals metrics (FCP, LCP, TTI, FID, INP, CLS)
- Detect page jank and frame rate drops
- Provide real-time performance data reports
- Support React integration

Technical Highlights:
- Based on Performance API and PerformanceObserver
- Use RequestAnimationFrame to calculate frame rate
- Support mobile and desktop device adaptation
- Provide multiple output formats: UMD/ESM/CJS

### 2. Large File Chunked Upload Library (files-buffer)

Location: `/libs/files-buffer`

Features:
- File chunking: Using `Blob.slice()` to split large files
- Resumable uploads: Record uploaded chunks, support continuing after page refresh
- Instant upload: Based on file hash verification to avoid duplicate uploads
- Concurrency control: Configurable number of simultaneous chunk uploads

Technical Highlights:
- Use Web Worker for file hash calculation to avoid blocking the main thread
- Based on Spark-MD5 for file fingerprint calculation
- Provide both React components and core API usage methods
- Support upload control (pause/resume/cancel)

### 3. Chrome Performance Monitoring Extension

Location: `/chrome/performance`

Features:
- Real-time monitoring of tab memory usage
- Memory leak detection (based on memory growth trend analysis)
- Monitor DOM node count changes
- Visualize memory usage trends

Technical Highlights:
- Based on Chrome Extension Manifest V3
- Built with React for extension UI
- Use IndexedDB to store historical monitoring data
- Integrate perfor-monitor library for performance metrics collection

### 4. Project Website

Location: `/website`

#### 4.1 Frontend (web)

Features:
- Project showcase and documentation
- Workflow visual editor
- Knowledge graph visualization
- File upload examples

Technical Highlights:
- Based on React + TypeScript + Vite
- Use @xyflow/react for workflow editor implementation
- Use Cytoscape.js for knowledge graph visualization
- Integrate files-buffer for large file upload functionality
- Use Zustand for state management

#### 4.2 Backend (server)

Features:
- File upload processing
- AI service integration
- SSE (Server-Sent Events) real-time communication
- API documentation (Swagger)

Technical Highlights:
- Based on Koa + TypeScript
- Integrate LangChain and OpenAI API
- Use WebSocket and SSE for real-time communication
- Support large file chunking, merging, and verification

## Functional Modules in Detail

### 1. Workflow Editor

Location: `/website/web/src/pages/Graph/WorkFlow`

Features:
- Visual workflow design
- Node dragging and connection
- Support multiple node types (start, approval, data processing, end)
- Node right-click menu and keyboard shortcuts
- Workflow import/export

Technical Implementation:
- Based on @xyflow/react 12.8.2
- Use Zustand for workflow state management
- Custom node and edge rendering
- Use lodash-es to optimize drag performance
- Support workflow data persistence

### 2. Knowledge Graph Visualization

Location: `/website/web/src/pages/Graph/Cytoscape`

Features:
- Knowledge graph node and relationship display
- Interactive graph operations (zoom, drag, select)
- Node grouping and filtering
- Graph layout algorithm selection

Technical Implementation:
- Based on Cytoscape.js
- Custom node and edge styles
- Support multiple layout algorithms
- Graph data import/export

### 3. Performance Monitoring Panel

Location: `/website/web/src/hooks/usePerformance.ts`

Features:
- Page performance metrics monitoring
- Performance data visualization
- Performance issue alerts

Technical Implementation:
- Integrate perfor-monitor library
- Custom React Hook encapsulation
- Performance data persistence
- Performance metric threshold configuration

### 4. File Upload Module

Location: `/website/web/src/pages/UploadPage`

Features:
- Large file chunked upload
- Upload progress display
- Resumable uploads
- Instant file upload

Technical Implementation:
- Integrate files-buffer library
- Custom upload components
- Upload state management
- Server-side API integration

## Development and Building

### Install Dependencies

```bash
pnpm install
```

### Development Mode

```bash
# Develop website
cd website
pnpm dev

# Develop performance monitoring library
cd libs/performance-monitor
pnpm dev

# Develop file upload library
cd libs/files-buffer
pnpm dev

# Develop Chrome extension
cd chrome/performance
pnpm build:dev
```

### Build Project

```bash
# Build all projects
pnpm build

# Build specific projects
pnpm --filter perfor-monitor build
pnpm --filter files-buffer build
pnpm --filter memory-monitor-extension build
pnpm --filter @website/web build
pnpm --filter @website/server build
```

## Deployment

### Website Deployment

```bash
cd website
./deploy.sh
```

### Library Publishing

```bash
cd libs/performance-monitor
pnpm publish:npm

cd libs/files-buffer
pnpm publish-npm
```

### Chrome Extension Publishing

```bash
cd chrome/performance
pnpm build:zip
# Then upload the zip file to the Chrome Web Store developer dashboard
```

## Future Plans

1. Enhance AI integration capabilities, providing smarter workflow recommendations
2. Extend the performance monitoring library to support more custom metrics
3. Optimize the file upload library to support more file processing scenarios
4. Develop VSCode extensions for better development experience
5. Add more visualization components and templates

## License

ISC and MIT (depending on the module)