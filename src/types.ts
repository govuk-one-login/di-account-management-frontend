import { ValidationChain } from "express-validator";
import express, { NextFunction, Request, Response } from "express";

export interface OIDCConfig {
  idp_url: string;
  callback_url: string;
  client_id: string;
  scopes: string | string[];
}

export type ExpressRouteFunc = (
  req: Request,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;

export type ValidationChainFunc = (
  | ValidationChain
  | ((
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => any)
)[];

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  name?: string;
  uri?: string;
  tls?: boolean;
  isLocal: boolean;
}
