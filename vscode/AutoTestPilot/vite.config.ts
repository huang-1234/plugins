import { defineConfig } from 'vite';
import vscode from '@tomjs/vite-plugin-vscode';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vscode({
      // VSCode 插件配置
      entry: 'src/extension.ts',
      outDir: 'dist',
      build: {
        minify: false,
        target: 'node16',
        external: ['vscode', 'fs', 'path', 'child_process'],
      },
      debug: true, // 调试模式
    })
  ],
  // 开发服务器配置
  server: {
    hmr: {
      port: 3030,
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['vscode'],
      output: {
        format: 'commonjs'
      }
    }
  }
});