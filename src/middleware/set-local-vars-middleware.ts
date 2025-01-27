import { NextFunction, Request, Response } from "express";
import {
  getAnalyticsCookieDomain,
  getAuthFrontEndUrl,
  getGtmId,
  getYourAccountUrl,
  googleAnalytics4GtmContainerId,
  universalAnalyticsGtmContainerId,
  googleAnalytics4Enabled,
  universalAnalyticsEnabled,
  selectContentTrackingEnabled,
  getDtRumUrl,
  missionLabsWebSocketAddress,
} from "../config";
import { generateNonce } from "../utils/strings";
import { PATH_DATA } from "../app.constants";
import { getSessionIdsFrom } from "../utils/session-ids";
import { getCurrentUrl } from "../utils/language-toggle";

export async function setLocalVarsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  res.locals.dynatraceRumUrl = getDtRumUrl();
  res.locals.missionLabWebSocketAddress = missionLabsWebSocketAddress();
  res.locals.gtmId = getGtmId();
  res.locals.scriptNonce = await generateNonce();
  res.locals.authFrontEndUrl = getAuthFrontEndUrl();
  res.locals.analyticsCookieDomain = getAnalyticsCookieDomain();
  res.locals.govAccountsUrl = getYourAccountUrl();
  res.locals.accountHome = PATH_DATA.YOUR_SERVICES.url;
  res.locals.accountSecurity = PATH_DATA.SECURITY.url;
  res.locals.accountSignOut = PATH_DATA.SIGN_OUT.url;
  res.locals.ga4ContainerId = googleAnalytics4GtmContainerId();
  res.locals.uaContainerId = universalAnalyticsGtmContainerId();
  res.locals.isGa4Enabled = googleAnalytics4Enabled();
  res.locals.isUaEnabled = universalAnalyticsEnabled();
  res.locals.isSelectContentTrackingEnabled = selectContentTrackingEnabled();
  res.locals.currentUrl = getCurrentUrl(req);

  const sessionIds = getSessionIdsFrom(req);
  res.locals.sessionId = sessionIds.sessionId;
  res.locals.clientSessionId = sessionIds.clientSessionId;
  res.locals.persistentSessionId = sessionIds.persistentSessionId;

  res.locals.trace =
    res.locals.persistentSessionId + "::" + res.locals.sessionId;

  next();
}
