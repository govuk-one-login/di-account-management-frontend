import { Request, Response } from "express";
import { CallbackParamsType, TokenSet, UserinfoResponse } from "openid-client";
import { PATH_DATA } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { ClientAssertionServiceInterface } from "../../utils/types";
import { clientAssertionGenerator } from "../../utils/oidc";

export function oidcAuthCallbackGet(
  service: ClientAssertionServiceInterface = clientAssertionGenerator()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const queryParams: CallbackParamsType = req.oidc.callbackParams(req);
    const clientAssertion = await service.generateAssertionJwt(
      req.oidc.metadata.client_id,
      req.oidc.issuer.metadata.token_endpoint
    );

    const tokenResponse: TokenSet = await req.oidc.callback(
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

    const userInfoResponse = await req.oidc.userinfo<UserinfoResponse>(
      tokenResponse.access_token,
      { method: "GET", via: "header" }
    );

    req.session.user = {
      email: userInfoResponse.email,
      phoneNumber: userInfoResponse.phone_number,
      subjectId: userInfoResponse.subject_Id,
      legacySubjectId: userInfoResponse.legacy_subject_Id,
      tokens: {
        idToken: tokenResponse.id_token,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
      },
      isAuthenticated: true,
      state: {},
    };

    return res.redirect(PATH_DATA.MANAGE_YOUR_ACCOUNT.url);
  };
}
