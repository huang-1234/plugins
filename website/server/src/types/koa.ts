import { Context, Request, Response } from 'koa';

export type KoaContext = Context;

export interface KoaRequest<RQ = unknown> extends Request {
  body: RQ;
  files: { file: File };
  rawBody: string;
}

export interface KoaResponse<RS = unknown> extends Response {
  body: RS;
  rawBody: string;
  status: number;
  message: string;
  data: RS;
  success: boolean;
  error: RS;
  code: number;
}
export interface IKoaRouterContext<RQ = unknown, RS = unknown> extends KoaContext {
  request: KoaRequest<RQ>;
  response: KoaResponse<RS>;
  body: RS;
}