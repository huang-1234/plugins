/**
 * SSR服务导出文件
 * 提供React服务端渲染功能
 */

import React from 'react';
import { renderToReadableStream } from 'react-dom/server';
import type { Context } from 'koa';

import { AppSSR } from './client/app.jsx';
import assetMap from './client/assetMap.json';
import { fetchData } from './client/data.js';

/**
 * 渲染React组件到HTML流
 * @param ctx Koa上下文
 * @param url 请求URL
 */
export async function renderToStream(ctx: Context, url: string): Promise<void> {
  try {
    let didError = false;

    // 预取数据
    const initialData = await fetchData(url);

    // 注入数据到全局变量
    const dataScript = `window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};`;

    const stream = await renderToReadableStream(
      React.createElement(AppSSR, { url, initialData }),
      {
        bootstrapScripts: [assetMap['main.js']],
        bootstrapScriptContent: `window.assetMap=${JSON.stringify(assetMap)};${dataScript}`,
        onError: (error) => {
          didError = true;
          console.error('SSR Error:', error);
          ctx.app.emit('error', error, ctx);
        }
      }
    );

    ctx.set('Content-Type', 'text/html');
    ctx.status = didError ? 500 : 200;
    ctx.body = stream;

  } catch (error) {
    ctx.status = 500;
    ctx.body = '<!DOCTYPE html><html><body><h1>服务器错误</h1><p>渲染过程中出现错误</p></body></html>';
    console.error('Render Error:', error);
  }
}

export { AppSSR, fetchData };