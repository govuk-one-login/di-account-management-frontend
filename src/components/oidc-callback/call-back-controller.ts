import { Request, Response } from "express";
import { CallbackParamsType, TokenSet, UserinfoResponse } from "openid-client";
import { LOG_MESSAGES, PATH_DATA, VECTORS_OF_TRUST } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { ClientAssertionServiceInterface } from "../../utils/types";
import { clientAssertionGenerator } from "../../utils/oidc";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { detectOidcError } from "../../utils/detect-oidc-error";
import {
  determineRedirectUri,
  handleOidcCallbackError,
  populateSessionWithUserInfo,
} from "./call-back-utils";
import xss from "xss";
import { logger } from "../../utils/logger";

export function oidcAuthCallbackGet(
  service: ClientAssertionServiceInterface = clientAssertionGenerator()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    try {
      req.metrics?.addMetric("oidcAuthCallbackGet", MetricUnit.Count, 1);
      const queryParams: CallbackParamsType = req.oidc.callbackParams(req);
      if (queryParams?.error) {
        await handleOidcCallbackError(req, res, queryParams);
      }

      const clientAssertion = await service.generateAssertionJwt(
        req.oidc.metadata.client_id,
        req.oidc.issuer.metadata.token_endpoint
      );

      if (!req.session.state || !req.session.nonce) {
        return res.redirect(PATH_DATA.SESSION_EXPIRED.url);
      }
      const tokenSet: TokenSet = await req.oidc.callback(
        req.oidc.metadata.redirect_uris[0],
        queryParams,
        { nonce: req.session.nonce, state: req.session.state },
        {
          exchangeBody: {
            client_assertion_type:
              "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            client_assertion: clientAssertion,
          },
        }
      );

      const vot = tokenSet.claims().vot;

      if (vot !== VECTORS_OF_TRUST.MEDIUM) {
        return res.redirect(PATH_DATA.START.url);
      }

      const userInfoResponse = await req.oidc.userinfo<UserinfoResponse>(
        tokenSet.access_token,
        { method: "GET", via: "header" }
      );

      populateSessionWithUserInfo(req, userInfoResponse, tokenSet);

      if (req.cookies?.gs) {
        logger.info(
          { trace: res.locals.trace },
          `gs cookie: ${req.cookies.gs}`
        );
        const ids = xss(req.cookies.gs).split(".");

        if (ids.length !== 2) {
          logger.error(
            { trace: res.locals.trace },
            LOG_MESSAGES.MALFORMED_GS_COOKIE(req.cookies.gs)
          );
        } else {
          req.session.authSessionIds = {
            sessionId: ids[0],
            clientSessionId: ids[1],
          };
        }
      } else {
        logger.info(
          { trace: res.locals.trace },
          LOG_MESSAGES.GS_COOKIE_NOT_IN_REQUEST
        );
      }

      // saved to session where `user_id` attribute is stored as a db item's root-level attribute that is used in indexing
      req.session.user_id = userInfoResponse.sub;
      res.locals.isUserLoggedIn = true;

      return res.redirect(determineRedirectUri(req, res));
    } catch (error) {
      const detected = detectOidcError(error);
      if (detected) {
        return await handleOidcCallbackError(req, res, {}, false);
      }

      throw error;
    }
  };
}
