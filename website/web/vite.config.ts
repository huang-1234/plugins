import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      external: ['@libs/*'] // 排除monorepo内部包
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        additionalData: '@import "@/styles/variables.less";',
      },
    },
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[local]_[hash:base64:5]',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:7788',
        changeOrigin: true,
      },
      '/sse': {
        target: 'http://localhost:7788',
        changeOrigin: true,
      },
      '/docs': {
        target: 'http://localhost:7788',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:7788',
        changeOrigin: true,
      }
    }
  }
});