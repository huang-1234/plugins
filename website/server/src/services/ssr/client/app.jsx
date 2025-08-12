import React from 'react';
import { Router } from './Router.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

// 应用根组件
export const AppSSR = ({ url, initialData }) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>React SSR 应用</title>
        <link rel="stylesheet" href="/client.bundle.css" />
      </head>
      <body>
        <div id="root">
          <ErrorBoundary>
            <Router url={url} initialData={initialData} />
          </ErrorBoundary>
          <nav>
            <ul>
              <li><a href="/">首页</a></li>
              <li><a href="/about">关于</a></li>
            </ul>
          </nav>
        </div>
      </body>
    </html>
  );
};