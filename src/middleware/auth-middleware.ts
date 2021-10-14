import { NextFunction, Request, Response } from "express";
import { getOIDCClient } from "../utils/oidc";
import { ExpressRouteFunc, OIDCConfig } from "../types";
import { ApiError } from "../utils/errors";

export function authMiddleware(config: OIDCConfig): ExpressRouteFunc {
  return async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    req.oidc = await getOIDCClient(config).catch((err:any) =>{
        throw new ApiError(err.message);
    });
    next();
  };
}
