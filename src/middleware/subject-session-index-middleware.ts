import { NextFunction, Request, Response } from "express";
import { getJWKS, getOIDCClient } from "../utils/oidc";
import { ExpressRouteFunc, OIDCConfig } from "../types";
import { ApiError } from "../utils/errors";
import { SubjectSessionIndexService } from "../utils/types";

export function subjectSessionIndexMiddleware(
  subjectSessionIndex: SubjectSessionIndexService
): ExpressRouteFunc {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.user) {
      subjectSessionIndex.addSession(req.session.user.subjectId, req.sessionID);
    }
    next();
  };
}
