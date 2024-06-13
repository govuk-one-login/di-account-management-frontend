import { NextFunction, Request, Response } from "express";
import { getJWKS, getOIDCClient } from "../utils/oidc.js";
import { ExpressRouteFunc, OIDCConfig } from "../types.js";
import { ApiError } from "../utils/errors.js";

export function authMiddleware(config: OIDCConfig): ExpressRouteFunc {
  return async (req: Request, res: Response, next: NextFunction) => {
    req.oidc = await getOIDCClient(config).catch((err: any) => {
      throw new ApiError(err.message);
    });
    req.issuerJWKS = await getJWKS(config);
    next();
  };
}
