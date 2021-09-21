import { NextFunction, Request, Response } from "express";
import { getOIDCClient } from "../utils/oidc";
import { ExpressRouteFunc, OIDCConfig } from "../types";

export function authMiddleware(config: OIDCConfig): ExpressRouteFunc {
  return async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    req.oidc = await getOIDCClient(config);
    next();
  };
}
