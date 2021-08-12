import express, { NextFunction, Router, Request, Response } from "express";
import { getOIDCClient } from "../utils/oidc";
import { OIDCConfig } from "../types";
import { asyncHandler } from "../utils/async";

export function authMiddleware(config: OIDCConfig) : Router {
  const router: Router = express.Router();

  router.use(asyncHandler(get));

  async function get(req: Request, res: Response, next: NextFunction) {
    req.oidc = await getOIDCClient(config);
    next();
  }

  return router;
}
