# Website Frontend Documentation

## Overview

This document provides a comprehensive guide to the frontend architecture, technology stack, coding standards, and functionality of the project website. The frontend is built with modern web technologies, focusing on performance, maintainability, and developer experience.

## Technology Stack

### Core Technologies

- **Framework**: React 18.2.0
- **Language**: TypeScript 5.8.3
- **Build Tool**: Vite 5.4.19
- **Package Management**: PNPM with Workspace
- **Styling**: Less with CSS Modules
- **UI Library**: Ant Design 5.26.7
- **State Management**:
  - Zustand 4.4.0
  - React Hooks
  - Immer 10.1.1 (for immutable state updates)

### Additional Libraries

- **Routing**: React Router DOM 6.22.0
- **HTTP Client**: Axios 1.11.0
- **Code Splitting**: loadable-components 2.2.3
- **Utilities**: lodash-es 4.17.21
- **Markdown Rendering**: react-markdown 9.0.1
- **Syntax Highlighting**: react-syntax-highlighter 15.5.0

### Visualization Libraries

- **Graph Visualization**:
  - Cytoscape.js 3.33.0 (for algorithm-focused graph visualization)
  - @xyflow/react 12.8.2 (for workflow visualization)
- **Data Visualization**:
  - @antv/g2 (for data analysis)
  - @antv/g6 (for business-oriented graphs)
  - @antv/x6 (for knowledge graphs)

### Performance Monitoring

- Custom performance monitoring using the `perfor-monitor` library (workspace package)
- Large file handling with `files-buffer` library (workspace package)

## Project Architecture

### Directory Structure

```
website/web/
├── node_modules/    # Third-party dependencies
├── public/          # Static assets
├── src/             # Source code
│   ├── assets/      # Images, icons, and other assets
│   ├── components/  # Reusable UI components
│   ├── hooks/       # Custom React hooks
│   ├── layouts/     # Layout components
│   ├── model/       # Data models and utilities
│   ├── modules/     # Feature-specific modules
│   ├── pages/       # Page components
│   │   ├── ChatPage/                 # AI chat interface
│   │   ├── DocsPage/                 # Documentation viewer
│   │   │   ├── PageDocsList/         # Document list component
│   │   │   └── PageDocsDetails/      # Document content component
│   │   ├── Graph/                    # Graph visualization pages
│   │   │   ├── Cytoscape/            # Cytoscape implementation
│   │   │   ├── KnowledgeGraphVisualization/ # Knowledge graph
│   │   │   └── WorkFlow/             # Workflow editor
│   │   ├── HomePage/                 # Landing page
│   │   └── UploadPage/               # File upload page
│   ├── services/    # API services
│   ├── styles/      # Global styles
│   └── main.tsx     # Application entry point
├── tech/            # Technical documentation
├── index.html       # Main HTML file
├── package.json     # Project configuration
├── tsconfig.json    # TypeScript configuration
└── vite.config.ts   # Build configuration
```

### Core Architectural Patterns

1. **Component-Based Architecture**
   - Modular components with clear responsibilities
   - Separation of concerns between UI, logic, and state

2. **Container/Presentational Pattern**
   - Container components handle state and logic
   - Presentational components focus on rendering UI

3. **Custom Hooks Pattern**
   - Business logic extracted into reusable hooks
   - Shared functionality across components

4. **Routing System**
   - Dynamic route generation from menu configuration
   - Nested routes for hierarchical page structure

5. **State Management**
   - Zustand for global state
   - React Context for component trees
   - Local state for component-specific data

## Key Features

### 1. Graph Visualization System

The application provides multiple graph visualization implementations:

- **Cytoscape Implementation**
  - Supports adjacency list data structure
  - Multiple layout algorithms (force-directed, circular, grid, topological)
  - Interactive nodes (drag, click, right-click menu)
  - Real-time updates

- **Workflow Editor**
  - Based on @xyflow/react
  - Custom node types and edge styles
  - Drag-and-drop node creation
  - Node context menus and keyboard shortcuts
  - Import/export functionality

- **Knowledge Graph Visualization**
  - Entity relationship visualization
  - Interactive exploration
  - Search and filtering capabilities

### 2. Documentation System

- **Document List Component**
  - Fetches and displays available documents
  - Handles navigation between documents
  - Provides visual feedback for selected document

- **Document Details Component**
  - Renders Markdown content with syntax highlighting
  - Supports code blocks with language detection
  - Responsive layout for various screen sizes

### 3. File Upload System

- Integration with `files-buffer` library
- Large file chunking and resumable uploads
- Progress tracking and error handling
- Upload status visualization

### 4. AI Chat Interface

- Interactive chat UI
- Integration with backend AI services
- Message history management
- Markdown rendering in responses

## Development Standards

### Code Organization

1. **Component Structure**
   - Each component in its own directory
   - Component file (`index.tsx`)
   - Style file (`index.module.less`)
   - Optional types file (`types.ts`)
   - Optional utilities file (`utils.ts`)

2. **File Naming Conventions**
   - PascalCase for component files
   - camelCase for utility files
   - kebab-case for asset files
   - All component styles use `.module.less` extension

### Styling Approach

1. **CSS Modules**
   - Local scope for component styles
   - Prevents style conflicts
   - Enables component reusability

2. **Global Styles**
   - Variables defined in `styles/variables.less`
   - Global styles in `styles/global.less`
   - Automatically imported into component styles

3. **Responsive Design**
   - Mobile-first approach
   - Media queries for different screen sizes
   - Flexible layouts using CSS Grid and Flexbox

### TypeScript Usage

1. **Type Definitions**
   - Interfaces for object structures
   - Type aliases for complex types
   - Enums for fixed sets of values

2. **Generic Components**
   - Reusable components with generic types
   - Type safety for component props

3. **Type Guards**
   - Runtime type checking when necessary
   - User-defined type guards for complex cases

### Performance Optimization

1. **Code Splitting**
   - Route-based code splitting
   - Dynamic imports for large components
   - Lazy loading for non-critical features

2. **Memoization**
   - React.memo for pure components
   - useMemo for expensive calculations
   - useCallback for stable function references

3. **Virtual Rendering**
   - Virtualized lists for large datasets
   - Pagination for API results
   - Incremental loading for large graphs

## Build and Deployment

### Development Environment

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The development server runs on port 5173 by default and proxies API requests to the backend server running on port 7788.

### Production Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

The production build generates optimized static files in the `dist` directory.

### Environment Configuration

- Development settings in `.env.development`
- Production settings in `.env.production`
- Local overrides in `.env.local` (not committed to version control)

## API Integration

### Backend Communication

- RESTful API calls using Axios
- API endpoints defined in service modules
- Centralized error handling and request interceptors

### Proxy Configuration

The development server proxies the following API paths to the backend:

```javascript
proxy: {
  '/api': 'http://localhost:7788',
  '/api/sse': 'http://localhost:7788',
  '/api/docs': 'http://localhost:7788',
  '/api/uploads': 'http://localhost:7788'
}
```

## Best Practices

1. **Component Design**
   - Keep components focused on a single responsibility
   - Extract reusable logic into custom hooks
   - Use composition over inheritance

2. **State Management**
   - Minimize global state
   - Use local state when possible
   - Consider performance implications of state updates

3. **Error Handling**
   - Implement error boundaries for component failures
   - Provide meaningful error messages
   - Handle API errors gracefully

4. **Accessibility**
   - Use semantic HTML elements
   - Include ARIA attributes when necessary
   - Ensure keyboard navigation works properly

5. **Testing**
   - Write unit tests for critical functionality
   - Use component testing for UI components
   - Implement integration tests for user flows

## Future Enhancements

1. **Performance Monitoring Dashboard**
   - Real-time performance metrics
   - Historical performance data
   - Automated performance testing

2. **Enhanced Graph Visualization**
   - Additional layout algorithms
   - Custom node and edge rendering
   - Advanced filtering and search

3. **Offline Support**
   - Service worker implementation
   - Offline data synchronization
   - Progressive Web App features

4. **Internationalization**
   - Multi-language support
   - Right-to-left language support
   - Localized date and number formatting
