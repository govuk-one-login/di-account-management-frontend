import { Request, Response } from "express";
import pino from "pino";
import { isSafeString, isValidUrl } from "./../../utils/strings";
import {
  supportWebchatContact,
  supportPhoneContact,
  showContactGuidance,
} from "../../config";
import { generateReferenceCode } from "./../../utils/referenceCode";

const CONTACT_ONE_LOGIN_TEMPLATE = "contact-govuk-one-login/index.njk";
const logger = pino();

export function contactGet(req: Request, res: Response): void {
  const isAuthenticated = req.session?.user?.isAuthenticated;
  let isLoggedOut = req.cookies?.lo;
  const fromURL = getFromUrlAndSaveIt(req);

  if (typeof isLoggedOut === "string") {
    isLoggedOut = JSON.parse(isLoggedOut);
  }

  if (!fromURL) {
    logger.info(
      "Request to contact-govuk-one-login page did not contain a valid fromURL in the request or session"
    );
  }

  const referenceCode = req.session.referenceCode
    ? req.session.referenceCode
    : generateReferenceCode();

  req.session.referenceCode = referenceCode;

  // optional fields from mobile
  const theme = getValueFromRequestOrSession(req, "theme");
  const appSessionId = getValueFromRequestOrSession(req, "appSessionId");
  const appErrorCode = getValueFromRequestOrSession(req, "appErrorCode");

  const data = {
    contactWebchatEnabled: supportWebchatContact(),
    contactPhoneEnabled: supportPhoneContact(),
    showContactGuidance: showContactGuidance(),
    showSignOut: isAuthenticated && !isLoggedOut,
    fromURL,
    appSessionId,
    appErrorCode,
    theme,
    referenceCode,
  };

  res.render(CONTACT_ONE_LOGIN_TEMPLATE, data);
}

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
