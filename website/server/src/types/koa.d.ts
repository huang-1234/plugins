// types/koa.d.ts (类型声明文件)
import { Context as KoaContext, Request as KoaRequest } from 'koa';
import { File } from 'formidable';

// 扩展 Koa 请求对象类型
declare module 'koa' {
  interface Request {
    // 文件上传信息
    // @ts-ignore
    files?: {
      file?: File | File[];
      [key: string]: File | File[] | undefined;
    };

    // 自定义请求体结构
    // @ts-ignore
    body?: {
      fileHash?: string;
      fileName?: string;
      size?: number;
      // @ts-ignore
      [key: string]: any;
    };
  }

  // 扩展 Koa 上下文类型
  interface Context {
    // 自定义上下文方法示例
    success(data?: any, message?: string): void;
    fail(code: number, message: string): void;

    // 身份验证相关
    user?: {
      id: number;
      username: string;
      role: string;
    };
  }
}

// 导出自定义上下文类型
export interface IKoaContext extends KoaContext {
  request: KoaRequest & {
    files?: {
      file?: File | File[];
    };
    body: {
      fileHash: string;
      fileName: string;
      size: number;
    };
  };
  user?: {
    id: number;
    username: string;
    role: string;
  };
  success(data?: any, message?: string): void;
  fail(code: number, message: string): void;
}