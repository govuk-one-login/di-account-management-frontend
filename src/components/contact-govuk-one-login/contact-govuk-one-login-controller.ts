import { Request, Response } from "express";
import { isValidUrl } from "./../../utils/strings";
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
  const data = {
    fromURL: fromURL,
  };
  res.render(CONTACT_ONE_LOGIN_TEMPLATE, data);
}

const getFromUrlAndSaveIt = (request: Request): string => {
  const fromURLFromRequest = request.query.fromURL as string;
  if (isValidUrl(fromURLFromRequest)) {
    request.session.fromURL = fromURLFromRequest;
    return fromURLFromRequest;
  }
  const fromURLFromSession = request.session.fromURL;
  return fromURLFromSession;
};
