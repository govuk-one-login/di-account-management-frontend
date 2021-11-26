import { NextFunction, Request, Response } from "express";
import {
  getAnalyticsCookieDomain,
  getAuthFrontEndUrl,
  getCookiesAndFeedbackLink,
  getGtmId,
  getYourAccountUrl,
} from "../config";
import { generateNonce } from "../utils/strings";
import * as querystring from "querystring";
import xss from "xss";

export function setLocalVarsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.locals.gtmId = getGtmId();
  res.locals.scriptNonce = generateNonce();
  res.locals.authFrontEndUrl = getAuthFrontEndUrl();
  res.locals.analyticsCookieDomain = getAnalyticsCookieDomain();
  res.locals.cookiesAndFeedbackUrl = getCookiesAndFeedbackLink();
  res.locals.govAccountsUrl = formatYourAccountUrl(req, getYourAccountUrl());
  if (req.cookies && req.cookies.gs) {
    const ids = xss(req.cookies["gs"]).split(".");
    res.locals.sessionId = ids[0];
    res.locals.clientSessionId = ids[1];
  }
  if (req.cookies && req.cookies["di-persistent-session-id"]) {
    res.locals.persistentSessionId = xss(
      req.cookies["di-persistent-session-id"]
    );
  }
  next();
}

function formatYourAccountUrl(req: Request, accountUrl: string) {
  const cookieConsent = req.cookies.cookies_preferences_set;
  if (cookieConsent) {
    const parsedCookie = JSON.parse(cookieConsent);
    return parsedCookie.gaId
      ? accountUrl + "?" + querystring.stringify({ _ga: parsedCookie.gaId })
      : accountUrl;
  }
  return accountUrl;
}
