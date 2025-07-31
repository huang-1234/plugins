import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import pkg from './package.json' assert { type: 'json' };

const isProd = process.env.NODE_ENV === 'production';

// 外部依赖，不打包进最终文件
const external = [
  ...Object.keys(pkg.peerDependencies || {}),
  'react/jsx-runtime'
];

// 共享插件
const commonPlugins = [
  resolve(),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.build.json',
  }),
];

// 生产环境添加代码压缩
const prodPlugins = isProd ? [terser()] : [];

export default defineConfig([
  // ESM 格式打包
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.mjs',
        format: 'esm',
        sourcemap: true,
      },
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: true,
      },
    ],
    external,
    plugins: [
      ...commonPlugins,
      ...prodPlugins,
    ],
  },
  // UMD 格式打包 (用于CDN/浏览器直接使用)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/performance-monitor.min.js',
      format: 'umd',
      name: 'PerformanceMonitor',
      sourcemap: true,
      globals: {
        'react': 'React',
        'react-dom': 'ReactDOM',
      },
    },
    external,
    plugins: [
      ...commonPlugins,
      ...prodPlugins,
    ],
  },
  // 类型声明文件打包
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
]);