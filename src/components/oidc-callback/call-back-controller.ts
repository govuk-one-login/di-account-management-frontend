import { Request, Response } from "express";
import { CallbackParamsType, TokenSet, UserinfoResponse } from "openid-client";
import { redactPhoneNumber } from "../../utils/strings";
import { PATH_NAMES } from "../../app.constants";
import { callbackService } from "./call-back-service";
import { ExpressRouteFunc } from "../../types";
import { CallbackServiceInterface } from "./types";

export function oidcAuthCallbackGet(
  service: CallbackServiceInterface = callbackService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const queryParams: CallbackParamsType = req.oidc.callbackParams(req);
    const clientAssertion = await service.generateAssertionJwt(
      req.oidc.metadata.client_id,
      req.oidc.issuer.metadata.token_endpoint
    );

    req.log.debug(clientAssertion);
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
      phone: redactPhoneNumber(userInfoResponse.phone_number),
      idToken: tokenResponse.id_token,
      accessToken: tokenResponse.access_token,
      isAuthenticated: true,
    };

    res.locals.isAuth = true;

    res.redirect(PATH_NAMES.MANAGE_YOUR_ACCOUNT);
  };
}
