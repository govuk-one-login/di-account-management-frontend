import { Request, Response } from "express";
import { CallbackParamsType, TokenSet, UserinfoResponse } from "openid-client";
import { ClientAssertionServiceInterface } from "../../utils/types";
import { LOG_MESSAGES, PATH_DATA } from "../../app.constants";
import { logger } from "../../utils/logger";
import { clearCookies, deleteExpressSession } from "../../utils/session-store";
import xss from "xss";

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

export async function handleOidcCallbackError(
  req: Request,
  res: Response,
  queryParams: CallbackParamsType,
  log = true
) {
  if (log) {
    logger.warn(
      {
        trace: res.locals.trace,
        error: queryParams.error,
        description: queryParams.error_description,
      },
      "OIDC callback error received"
    );
  }
  await deleteExpressSession(req);
  clearCookies(req, res, ["am"]);
  return res.redirect(PATH_DATA.SESSION_EXPIRED.url);
}

export function populateSessionWithUserInfo(
  req: Request,
  res: Response,
  userInfo: UserinfoResponse,
  tokenSet: TokenSet
) {
  req.session.user = {
    email: userInfo.email,
    phoneNumber: userInfo.phone_number,
    isPhoneNumberVerified: userInfo.phone_number_verified as boolean,
    subjectId: userInfo.sub,
    legacySubjectId: userInfo.legacy_subject_id as string,
    publicSubjectId: userInfo.public_subject_id as string,
    tokens: {
      idToken: tokenSet.id_token,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
    },
    isAuthenticated: true,
    state: {},
  };

  /** saved to session where `user_id` attribute is stored as
   a db item's root-level attribute that is used in indexing **/

  req.session.user_id = userInfo.sub;
  res.locals.isUserLoggedIn = true;
}

export function attachSessionIdsFromGsCookie(req: Request, res: Response) {
  const cookie = req.cookies?.gs;
  if (!cookie) {
    logger.info(
      { trace: res.locals.trace },
      LOG_MESSAGES.GS_COOKIE_NOT_IN_REQUEST
    );
    return;
  }

  logger.info({ trace: res.locals.trace }, `gs cookie: ${cookie}`);
  const ids = xss(cookie).split(".");
  if (ids.length !== 2) {
    logger.error(
      { trace: res.locals.trace },
      LOG_MESSAGES.MALFORMED_GS_COOKIE(cookie)
    );
  } else {
    req.session.authSessionIds = {
      sessionId: ids[0],
      clientSessionId: ids[1],
    };
  }
}
