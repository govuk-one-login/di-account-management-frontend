import { NextFunction, Request, Response } from "express";
import { ExpressRouteFunc, OIDCConfig } from "../types.js";
import { getOIDCClient } from "../utils/oidc.js";
import { OIDC_ERRORS } from "../app.constants.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

export function authMiddleware(config: OIDCConfig): ExpressRouteFunc {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.oidc = await getOIDCClient(config);
      next();
    } catch (error) {
      if (error.message === OIDC_ERRORS.OIDC_DISCOVERY_UNAVAILABLE) {
        req.metrics?.addMetric("OIDCDiscoveryUnavailable", MetricUnit.Count, 1);
      }
    }
  };
}
