import { NextFunction, Request, Response } from "express";
import { ExpressRouteFunc } from "../types";
import { Client } from "openid-client";

export function authMiddleware(oidcClient: Client): ExpressRouteFunc {
  return (req: Request, res: Response, next: NextFunction) => {
    req.oidc = oidcClient;
    next();
  };
}
