import { Request, Response } from "express";
import { CallbackParamsType, UserinfoResponse } from "openid-client";
import { PATH_DATA, VECTORS_OF_TRUST } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { ClientAssertionServiceInterface } from "../../utils/types";
import { clientAssertionGenerator } from "../../utils/oidc";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { detectOidcError } from "../../utils/detect-oidc-error";
import {
  attachSessionIdsFromGsCookie,
  handleOidcCallbackError,
  populateSessionWithUserInfo,
} from "./call-back-helper";
import { determineRedirectUri, exchangeToken } from "./call-back-utils";

export function oidcAuthCallbackGet(
  service: ClientAssertionServiceInterface = clientAssertionGenerator()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    try {
      req.metrics?.addMetric("oidcAuthCallbackGet", MetricUnit.Count, 1);
      const queryParams: CallbackParamsType = req.oidc.callbackParams(req);
      if (queryParams?.error) {
        return await handleOidcCallbackError(req, res, queryParams);
      }

      if (!req.session.state || !req.session.nonce) {
        return res.redirect(PATH_DATA.SESSION_EXPIRED.url);
      }

      const tokenSet = await exchangeToken(req, service, queryParams);
      if (tokenSet.claims().vot !== VECTORS_OF_TRUST.MEDIUM) {
        return res.redirect(PATH_DATA.START.url);
      }

      const userInfo = await req.oidc.userinfo<UserinfoResponse>(
        tokenSet.access_token,
        { method: "GET", via: "header" }
      );

      populateSessionWithUserInfo(req, res, userInfo, tokenSet);
      attachSessionIdsFromGsCookie(req, res);

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
