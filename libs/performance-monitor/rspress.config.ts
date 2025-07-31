import { defineConfig } from 'rspress/config';

export default defineConfig({
  // 文档根目录
  root: 'docs',
  title: '性能指标监控',
  description: '性能指标监控',
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        content: 'https://github.com/dc-js/dc',
        mode: 'link'
      }
    ]
  }
});