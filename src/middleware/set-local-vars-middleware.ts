import { NextFunction, Request, Response } from "express";
import {
  getAnalyticsCookieDomain,
  getAuthFrontEndUrl,
  getGtmId,
  getYourAccountUrl,
  googleAnalytics4GtmContainerId,
  universalAnalyticsGtmContainerId,
  googleAnalytics4Disabled,
  universalAnalyticsDisabled,
} from "../config.js";
import { generateNonce } from "../utils/strings.js";
import { PATH_DATA } from "../app.constants.js";
import { getSessionIdsFrom } from "../utils/session-ids.js";
import { getCurrentUrl } from "../utils/language-toggle.js";

export function setLocalVarsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.locals.gtmId = getGtmId();
  res.locals.scriptNonce = generateNonce();
  res.locals.authFrontEndUrl = getAuthFrontEndUrl();
  res.locals.analyticsCookieDomain = getAnalyticsCookieDomain();
  res.locals.govAccountsUrl = getYourAccountUrl();
  res.locals.accountHome = PATH_DATA.YOUR_SERVICES.url;
  res.locals.accountSecurity = PATH_DATA.SECURITY.url;
  res.locals.accountSignOut = PATH_DATA.SIGN_OUT.url;
  res.locals.ga4ContainerId = googleAnalytics4GtmContainerId();
  res.locals.uaContainerId = universalAnalyticsGtmContainerId();
  res.locals.isGa4Disabled = googleAnalytics4Disabled();
  res.locals.isUaDisabled = universalAnalyticsDisabled();
  res.locals.currentUrl = getCurrentUrl(req);

  const sessionIds = getSessionIdsFrom(req);
  res.locals.sessionId = sessionIds.sessionId;
  res.locals.clientSessionId = sessionIds.clientSessionId;
  res.locals.persistentSessionId = sessionIds.persistentSessionId;

  res.locals.trace =
    res.locals.persistentSessionId + "::" + res.locals.sessionId;

  next();
}
