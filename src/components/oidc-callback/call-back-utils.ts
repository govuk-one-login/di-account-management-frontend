import { Request, Response } from "express";
import { CallbackParamsType, TokenSet, UserinfoResponse } from "openid-client";
import { LOG_MESSAGES, PATH_DATA } from "../../app.constants";
import { logger } from "../../utils/logger";
import { deleteExpressSession } from "../../utils/session-store";
import xss from "xss";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

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

export async function generateTokenSet(
  req: Request,
  queryParams: CallbackParamsType,
  clientAssertion: string
) {
  logger.info(
    { trace: req.res?.locals.trace },
    `request session state: ${req.session.state}`
  );

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
  logger.info(
    { trace: req.res?.locals.trace },
    `Generated token session state: ${tokenSet.session_state}`
  );
  if (tokenSet.session_state !== req.session.state) {
    this.handleOidcCallbackError(
      req,
      req.res!,
      {
        error: "session_state_mismatch",
        description: "Session state mismatch after OICD callback",
      },
      false
    );
  }
  return tokenSet;
}

export function determineRedirectUri(req: Request): string {
  let redirectUri = req.session?.currentURL || PATH_DATA.YOUR_SERVICES.url;
  const crossDomainGaIdParam = req.query._ga as string;
  if (
    crossDomainGaIdParam &&
    req.query.cookie_consent === COOKIE_CONSENT.ACCEPT
  ) {
    const searchParams = new URLSearchParams({ _ga: crossDomainGaIdParam });
    redirectUri += `?${searchParams.toString()}`;
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
  req.metrics?.addMetric("oidcCallbackError", MetricUnit.Count, 1);
  await deleteExpressSession(req);

  if (queryParams.error == "temporarily_unavailable") {
    return res.redirect(PATH_DATA.UNAVAILABLE_TEMPORARY.url);
  } else {
    return res.redirect(PATH_DATA.SESSION_EXPIRED.url);
  }
}

export function populateSessionWithUserInfo(
  req: Request,
  userInfoResponse: UserinfoResponse,
  tokenSet: TokenSet
) {
  req.session.user = {
    email: userInfoResponse.email,
    phoneNumber: userInfoResponse.phone_number,
    isPhoneNumberVerified: userInfoResponse.phone_number_verified as boolean,
    subjectId: userInfoResponse.sub,
    legacySubjectId: userInfoResponse.legacy_subject_id as string,
    publicSubjectId: userInfoResponse.public_subject_id as string,
    tokens: {
      idToken: tokenSet.id_token,
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
    },
    isAuthenticated: true,
    state: {},
  };
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
