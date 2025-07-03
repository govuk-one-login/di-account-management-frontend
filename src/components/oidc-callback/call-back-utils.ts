import { Request, Response } from "express";
import { CallbackParamsType, TokenSet } from "openid-client";
import { ClientAssertionServiceInterface } from "../../utils/types";
import { PATH_DATA } from "../../app.constants";

const COOKIES_PREFERENCES_SET = "cookies_preferences_set";

export const COOKIE_CONSENT = {
  ACCEPT: "accept",
  REJECT: "reject",
  NOT_ENGAGED: "not-engaged",
};

export function setPreferencesCookie(
  cookieConsent: string,
  res: Response,
  gaId: string
) {
  let cookieValue: any = {};
  const cookieExpires = new Date();

  if ([COOKIE_CONSENT.ACCEPT, COOKIE_CONSENT.REJECT].includes(cookieConsent)) {
    cookieExpires.setFullYear(cookieExpires.getFullYear() + 1);

    cookieValue = {
      analytics: cookieConsent === COOKIE_CONSENT.ACCEPT,
    };

    if (cookieConsent === COOKIE_CONSENT.ACCEPT && gaId) {
      cookieValue.gaId = gaId;
    }
  } else {
    cookieExpires.setFullYear(cookieExpires.getFullYear() - 1);
  }

  res.cookie(COOKIES_PREFERENCES_SET, JSON.stringify(cookieValue), {
    expires: cookieExpires,
    secure: true,
    domain: res.locals.analyticsCookieDomain,
  });
}

export async function exchangeToken(
  req: Request,
  service: ClientAssertionServiceInterface,
  queryParams: CallbackParamsType
): Promise<TokenSet> {
  const clientAssertion = await service.generateAssertionJwt(
    req.oidc.metadata.client_id,
    req.oidc.issuer.metadata.token_endpoint
  );

  return req.oidc.callback(
    req.oidc.metadata.redirect_uris[0],
    queryParams,
    {
      nonce: req.session.nonce,
      state: req.session.state,
    },
    {
      exchangeBody: {
        client_assertion_type:
          "urn:ietf:params:oauth:client-assertioncall-type:jwt-bearer",
        client_assertion: clientAssertion,
      },
    }
  );
}

export function determineRedirectUri(req: Request, res: Response): string {
  let redirectUri = req.session.currentURL || PATH_DATA.YOUR_SERVICES.url;
  const crossDomainGaIdParam = req.query._ga as string;

  if (req.query.cookie_consent) {
    setPreferencesCookie(
      req.query.cookie_consent as string,
      res,
      crossDomainGaIdParam
    );

    if (
      crossDomainGaIdParam &&
      req.query.cookie_consent === COOKIE_CONSENT.ACCEPT
    ) {
      const searchParams = new URLSearchParams({ _ga: crossDomainGaIdParam });
      redirectUri += `?${searchParams.toString()}`;
    }
  }

  return redirectUri;
}
