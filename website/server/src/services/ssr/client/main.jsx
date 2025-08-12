import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { AppSSR } from './app.jsx';

// 客户端水合，使用当前URL和服务端注入的初始数据
const url = window.location.pathname;
const initialData = window.__INITIAL_DATA__;

hydrateRoot(
  document,
  <AppSSR url={url} initialData={initialData} />
);