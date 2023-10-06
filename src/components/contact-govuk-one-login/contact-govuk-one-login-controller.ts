import { Request, Response } from "express";
import { isSafeString, isValidUrl } from "./../../utils/strings";
import pino from "pino";

const CONTACT_ONE_LOGIN_TEMPLATE = "contact-govuk-one-login/index.njk";
const logger = pino();

export function contactGet(req: Request, res: Response): void {
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

  const data = {
    fromURL,
    appSessionId,
    appErrorCode,
    theme,
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
