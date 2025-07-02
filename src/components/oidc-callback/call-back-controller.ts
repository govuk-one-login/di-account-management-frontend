import { Request, Response } from "express";
import { CallbackParamsType, TokenSet, UserinfoResponse } from "openid-client";
import { LOG_MESSAGES, PATH_DATA, VECTORS_OF_TRUST } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { ClientAssertionServiceInterface } from "../../utils/types";
import { clientAssertionGenerator } from "../../utils/oidc";
import xss from "xss";
import { logger } from "../../utils/logger";
import { deleteExpressSession } from "../../utils/session-store";

const COOKIES_PREFERENCES_SET = "cookies_preferences_set";

export const COOKIE_CONSENT = {
  ACCEPT: "accept",
  REJECT: "reject",
  NOT_ENGAGED: "not-engaged",
};

function setPreferencesCookie(
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

export function oidcAuthCallbackGet(
  service: ClientAssertionServiceInterface = clientAssertionGenerator()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const queryParams: CallbackParamsType = req.oidc.callbackParams(req);
    if (queryParams?.error) {
      logger.warn(
        {
          trace: res.locals.trace,
          error: queryParams.error,
          description: queryParams.error_description,
        },
        "OIDC callback error received"
      );
      deleteExpressSession(req);
      return res.redirect(PATH_DATA.SESSION_EXPIRED.url);
    }

    const clientAssertion = await service.generateAssertionJwt(
      req.oidc.metadata.client_id,
      req.oidc.issuer.metadata.token_endpoint
    );
    let redirectUri;
    const crossDomainGaIdParam = req.query._ga as string;

    if (req.session.currentURL) {
      redirectUri = req.session.currentURL;
    } else {
      redirectUri = PATH_DATA.YOUR_SERVICES.url;
    }
    if (!req.session.state) {
      return res.redirect(PATH_DATA.SESSION_EXPIRED.url);
    }
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
      isPhoneNumberVerified: userInfoResponse.phone_number_verified as boolean,
      subjectId: userInfoResponse.sub,
      legacySubjectId: userInfoResponse.legacy_subject_id as string,
      publicSubjectId: userInfoResponse.public_subject_id as string,
      tokens: {
        idToken: tokenResponse.id_token,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
      },
      isAuthenticated: true,
      state: {},
    };

    if (req.cookies?.gs) {
      logger.info({ trace: res.locals.trace }, `gs cookie: ${req.cookies.gs}`);
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
        redirectUri = redirectUri + "?" + searchParams.toString();
      }
    }

    return res.redirect(redirectUri);
  };
}
