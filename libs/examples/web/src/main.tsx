import React from 'react';
import ReactDOM from 'react-dom/client';
import { BasicExample } from './BasicExample';
import './styles.css';

// 渲染 React 应用
ReactDOM.createRoot(document.getElementById('react-app')!).render(
  <React.StrictMode>
    <BasicExample />
  </React.StrictMode>
);