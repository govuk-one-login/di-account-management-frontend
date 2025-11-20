import { NextFunction, Request, Response } from "express";
import {
  getAnalyticsCookieDomain,
  getAuthFrontEndUrl,
  getFingerprintCookieDomain,
  getGtmId,
  getYourAccountUrl,
  googleAnalytics4GtmContainerId,
  googleAnalytics4Enabled,
  selectContentTrackingEnabled,
  getDtRumUrl,
  missionLabsWebSocketAddress,
  isProd,
} from "../config";
import { generateNonce } from "../utils/strings";
import { PATH_DATA } from "../app.constants";
import { getSessionIdsFrom } from "../utils/session-ids";
import { getCurrentUrl } from "../utils/language-toggle";
import { generateStaticHash } from "../utils/generate-static-hash";
import { randomUUID } from "node:crypto";

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
  res.locals.fingerprintCookieDomain = getFingerprintCookieDomain();
  res.locals.govAccountsUrl = getYourAccountUrl();
  res.locals.accountHome = PATH_DATA.YOUR_SERVICES.url;
  res.locals.accountSecurity = PATH_DATA.SECURITY.url;
  res.locals.accountSignOut = PATH_DATA.SIGN_OUT.url;
  res.locals.ga4ContainerId = googleAnalytics4GtmContainerId();
  res.locals.isGa4Enabled = googleAnalytics4Enabled();
  res.locals.isSelectContentTrackingEnabled = selectContentTrackingEnabled();
  res.locals.currentUrl = getCurrentUrl(req);
  res.locals.isProd = isProd();
  res.locals.staticHash = await generateStaticHash();

  const sessionIds = getSessionIdsFrom(req);
  res.locals.sessionId = sessionIds.sessionId;
  res.locals.clientSessionId = sessionIds.clientSessionId;
  res.locals.persistentSessionId = sessionIds.persistentSessionId;

  const trace = req.session.trace ?? randomUUID();
  req.session.trace = trace;
  res.locals.trace = trace;

  res.locals.opl = undefined;

  next();
}
