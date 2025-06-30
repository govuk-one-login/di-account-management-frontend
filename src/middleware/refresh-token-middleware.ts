import { NextFunction, Request, Response } from "express";
import { isTokenExpired, clientAssertionGenerator } from "../utils/oidc";
import { ExpressRouteFunc } from "../types";
import { ClientAssertionServiceInterface } from "../utils/types";
import { retryableFunction } from "../utils/retryableFunction";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

export function refreshTokenMiddleware(
  service: ClientAssertionServiceInterface = clientAssertionGenerator()
): ExpressRouteFunc {
  return async function (req: Request, res: Response, next: NextFunction) {
    const accessToken = req.session.user.tokens.accessToken;

    if (isTokenExpired(accessToken)) {
      try {
        const clientAssertion = await service.generateAssertionJwt(
          req.oidc.metadata.client_id,
          req.oidc.issuer.metadata.token_endpoint
        );

        const tokenSet = await retryableFunction(
          req.oidc.refresh.bind(req.oidc) as typeof req.oidc.refresh,
          [
            req.session.user.tokens.refreshToken,
            {
              exchangeBody: {
                client_assertion_type:
                  "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                client_assertion: clientAssertion,
              },
            },
          ]
        );
        req.session.user.tokens.accessToken = tokenSet.access_token;
        req.session.user.tokens.refreshToken = tokenSet.refresh_token;
      } catch (error) {
        req.metrics?.addMetric(
          "refreshTokenMiddlewareError",
          MetricUnit.Count,
          1
        );
        req.log.error(error.message);
        return next(error);
      }
    }

    next();
  };
}
