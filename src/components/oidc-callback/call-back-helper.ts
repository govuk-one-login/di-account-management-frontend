import { Request, Response } from "express";
import { CallbackParamsType, UserinfoResponse } from "openid-client";
import { TokenSet } from "openid-client";
import xss from "xss";
import { LOG_MESSAGES, PATH_DATA } from "../../app.constants";
import { logger } from "../../utils/logger";
import { clearCookies, deleteExpressSession } from "../../utils/session-store";

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
