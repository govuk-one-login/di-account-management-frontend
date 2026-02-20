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
  determineRedirectUri,
  generateTokenSet,
  handleOidcCallbackError,
  populateSessionWithUserInfo,
  setPreferencesCookie,
} from "./call-back-utils";

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
      if (queryParams.session_state !== req.session.state) {
        await handleOidcCallbackError(
          req,
          req.res!,
          {
            error: "session_state_mismatch",
            description: "Session state mismatch after OICD callback",
          },
          false
        );
      }

      const clientAssertion = await service.generateAssertionJwt(
        req.oidc.metadata.client_id,
        req.oidc.issuer.metadata.token_endpoint
      );

      if (!req.session?.state || !req.session?.nonce) {
        return res.redirect(PATH_DATA.SESSION_EXPIRED.url);
      }

      const tokenSet = await generateTokenSet(
        req,
        queryParams,
        clientAssertion
      );
      const vot = tokenSet.claims().vot;
      if (vot !== VECTORS_OF_TRUST.MEDIUM) {
        return res.redirect(PATH_DATA.START.url);
      }

      let userInfoResponse: UserinfoResponse;
      try {
        userInfoResponse = await req.oidc.userinfo<UserinfoResponse>(
          tokenSet.access_token,
          { method: "GET", via: "header" }
        );
      } catch {
        req.metrics?.addMetric("UserInfoError", MetricUnit.Count, 1);
        throw new Error("Failed to retrieve user info");
      }

      populateSessionWithUserInfo(req, userInfoResponse, tokenSet);

      attachSessionIdsFromGsCookie(req, res);

      // saved to session where `user_id` attribute is stored as a db item's root-level attribute that is used in indexing
      req.session.user_id = userInfoResponse.sub;
      res.locals.isUserLoggedIn = true;

      const crossDomainGaIdParam = req.query._ga as string;

      if (req.query.cookie_consent) {
        setPreferencesCookie(
          req.query.cookie_consent as string,
          res,
          crossDomainGaIdParam
        );
      }

      const redirectUri = determineRedirectUri(req);

      return res.redirect(redirectUri);
    } catch (error) {
      const detected = detectOidcError(error);
      if (detected) {
        return await handleOidcCallbackError(req, res, {}, false);
      }

      throw error;
    }
  };
}
