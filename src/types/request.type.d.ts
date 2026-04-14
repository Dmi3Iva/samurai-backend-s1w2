import type { Request } from "express";

export interface RequestWithBody<T> extends Request {
  body: T;
}

export interface RequestWithParams<P> extends Request {
  params: P;
}

export interface RequestWithQuery<Q> extends Request {
  query: Q;
}

export interface RequestWithHeaders<H> extends Request {
  headers: H;
}
