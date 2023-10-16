import { Request, Response } from "express";
import { logger } from "../../utils/logger";
import { isSafeString, isValidUrl } from "./../../utils/strings";
import {
  getWebchatUrl,
  supportWebchatContact,
  supportPhoneContact,
  showContactGuidance,
  getContactEmailServiceUrl,
} from "../../config";
import { generateReferenceCode } from "./../../utils/referenceCode";

const CONTACT_ONE_LOGIN_TEMPLATE = "contact-govuk-one-login/index.njk";

export function contactGet(req: Request, res: Response): void {
  const isAuthenticated = req.session?.user?.isAuthenticated;
  let isLoggedOut = req.cookies?.lo;
  if (typeof isLoggedOut === "string") {
    isLoggedOut = JSON.parse(isLoggedOut);
  }

  const referenceCode = req.session.referenceCode
    ? req.session.referenceCode
    : generateReferenceCode();
  req.session.referenceCode = referenceCode;

  const contactEmailServiceUrl =
    buildContactEmailServiceUrlAndSaveDataToSession(req).toString();

  logContactDataFromSession(req);

  const data = {
    contactWebchatEnabled: supportWebchatContact(),
    contactPhoneEnabled: supportPhoneContact(),
    showContactGuidance: showContactGuidance(),
    showSignOut: isAuthenticated && !isLoggedOut,
    referenceCode,
    contactEmailServiceUrl: contactEmailServiceUrl,
    webchatSource: getWebchatUrl(),
  };

  res.render(CONTACT_ONE_LOGIN_TEMPLATE, data);
}

const buildContactEmailServiceUrlAndSaveDataToSession = (req: Request): URL => {
  const fromURL = getFromUrlAndSaveIt(req);
  if (!fromURL) {
    logger.info(
      "Request to contact-govuk-one-login page did not contain a valid fromURL in the request or session"
    );
  }
  // optional fields from mobile
  const theme = getValueFromRequestOrSession(req, "theme");
  const appSessionId = getValueFromRequestOrSession(req, "appSessionId");
  const appErrorCode = getValueFromRequestOrSession(req, "appErrorCode");

  const contactEmailServiceUrl: URL = new URL(getContactEmailServiceUrl());

  if (fromURL) {
    contactEmailServiceUrl.searchParams.append("fromURL", fromURL);
  }
  if (theme) {
    contactEmailServiceUrl.searchParams.append("theme", theme);
  }
  if (appSessionId) {
    contactEmailServiceUrl.searchParams.append("appSessionId", appSessionId);
  }
  if (appErrorCode) {
    contactEmailServiceUrl.searchParams.append("appErrorCode", appErrorCode);
  }
  return contactEmailServiceUrl;
};

const getFromUrlAndSaveIt = (request: Request): string => {
  const fromURLFromRequest = request.query.fromURL as string;
  if (fromURLFromRequest && isValidUrl(fromURLFromRequest)) {
    request.session.fromURL = fromURLFromRequest;
    return fromURLFromRequest;
  } else if (fromURLFromRequest) {
    logger.error(
      "fromURL in request query for contact-govuk-one-login page did not pass validation"
    );
  }
  const fromURLFromSession = request.session.fromURL;
  return fromURLFromSession;
};

const getValueFromRequestOrSession = (
  request: Request,
  propertyName: string
): string => {
  const valueFromRequest = request.query[`${propertyName}`] as string;
  if (valueFromRequest && isSafeString(valueFromRequest)) {
    request.session[`${propertyName}`] = valueFromRequest;
    return valueFromRequest;
  } else if (valueFromRequest) {
    logger.error(
      `${propertyName} in request query for contact-govuk-one-login page did not pass validation`
    );
  }
  const valueFromSession = request.session[`${propertyName}`];
  return valueFromSession;
};

const logContactDataFromSession = (req: Request) => {
  logger.info(
    {
      fromURL: req.session.fromURL,
      referenceCode: req.session.referenceCode,
      appSessionId: req.session.appSessionId,
      appErrorCode: req.session.appErrorCode,
      sessionId: req.session.user?.sessionId,
      persistentSessionId: req.session.user?.persistentSessionId,
      userAgent: req.headers["user-agent"],
    },
    "User visited triage page"
  );
};
