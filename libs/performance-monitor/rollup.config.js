import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import pkg from './package.json' assert { type: 'json' };

const external = [
  ...Object.keys(pkg.peerDependencies || {}),
  'react/jsx-runtime'
];

export default defineConfig([
  // ESM 和 CJS 构建
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'esm',
        sourcemap: true
      },
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: true
      }
    ],
    external,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: true,
        declarationDir: 'dist/types'
      })
    ]
  },
  // UMD 构建 (浏览器可用，包含所有依赖)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/performance-monitor.min.js',
      format: 'umd',
      name: 'PerformanceMonitor',
      sourcemap: true,
      globals: {
        'react': 'React',
        'react-dom': 'ReactDOM'
      }
    },
    external: ['react', 'react-dom'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
      }),
      terser()
    ]
  },
  // 类型定义文件
  {
    input: 'dist/types/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  }
]);