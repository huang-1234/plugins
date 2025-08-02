import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const port = 5173;

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  base: './',
  server: {
    port,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname),
    },
  },
});