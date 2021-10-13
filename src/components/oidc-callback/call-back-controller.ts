import { Request, Response } from "express";
import { CallbackParamsType, TokenSet, UserinfoResponse } from "openid-client";
import { PATH_DATA, VECTORS_OF_TRUST } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { ClientAssertionServiceInterface } from "../../utils/types";
import { clientAssertionGenerator } from "../../utils/oidc";

const COOKIES_PREFERENCES_SET = "cookies_preferences_set";

export const COOKIE_CONSENT = {
  ACCEPT: "accept",
  REJECT: "reject",
  NOT_ENGAGED: "not-engaged",
};

function setPreferencesCookie(cookieConsent: string, res: Response) {
  if ([COOKIE_CONSENT.ACCEPT, COOKIE_CONSENT.REJECT].includes(cookieConsent)) {
    const yearFromNow = new Date();
    yearFromNow.setFullYear(yearFromNow.getFullYear() + 1);

    res.cookie(
      COOKIES_PREFERENCES_SET,
      JSON.stringify({ analytics: cookieConsent === COOKIE_CONSENT.ACCEPT }),
      {
        expires: yearFromNow,
        secure: true,
      }
    );
  } else {
    const expiredDate = new Date();
    expiredDate.setFullYear(expiredDate.getFullYear() - 1);
    res.cookie(COOKIES_PREFERENCES_SET, "", {
      expires: expiredDate,
      secure: true,
    });
  }
}

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

    const vot = tokenResponse.claims().vot;

    if (vot !== VECTORS_OF_TRUST.MEDIUM) {
      return res.redirect(PATH_DATA.START.url);
    }

    const userInfoResponse = await req.oidc.userinfo<UserinfoResponse>(
      tokenResponse.access_token,
      { method: "GET", via: "header" }
    );

    req.session.user = {
      email: userInfoResponse.email,
      phoneNumber: userInfoResponse.phone_number,
      subjectId: userInfoResponse.sub,
      legacySubjectId: userInfoResponse.legacy_subject_id,
      tokens: {
        idToken: tokenResponse.id_token,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
      },
      isAuthenticated: true,
      state: {},
    };

    if (req.query.cookie_consent) {
      setPreferencesCookie(req.query.cookie_consent as string, res);
    }

    return res.redirect(PATH_DATA.MANAGE_YOUR_ACCOUNT.url);
  };
}
