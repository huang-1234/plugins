import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background.ts'),
        contentScript: resolve(__dirname, 'src/contentScript.ts')
      },
      output: {
        entryFileNames: (chunk) => {
          return chunk.name === 'index' ? 'assets/[name]-[hash].js' : '[name].js';
        }
      }
    }
  },
  resolve: {
    alias: {
      'performance-monitor': resolve(__dirname, '../libs/performance-monitor/src')
    }
  }
});