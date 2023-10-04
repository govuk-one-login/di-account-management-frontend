import { Request, Response } from "express";
import pino from "pino";
import { isValidUrl } from "./../../utils/strings";
<<<<<<< HEAD
import {
  supportWebchatContact,
  supportPhoneContact,
  showContactGuidance,
} from "../../config";

const CONTACT_ONE_LOGIN_TEMPLATE = "contact-govuk-one-login/index.njk";
const logger = pino();

export function contactGet(req: Request, res: Response): void {
  const isAuthenticated = req.session?.user?.isAuthenticated;
  let isLoggedOut = req.cookies?.lo;
  const fromURL = getFromUrlAndSaveIt(req);

  if (typeof(isLoggedOut) === 'string') {
    isLoggedOut = JSON.parse(isLoggedOut)
  }
  
  if (!fromURL) {
    logger.info(
      "Request to contact-govuk-one-login page did not contain a valid fromURL in the request or session"
    );
  }

  const data = {
    contactWebchatEnabled: supportWebchatContact(),
    contactPhoneEnabled: supportPhoneContact(),
    showContactGuidance: showContactGuidance(),
    showSignOut: isAuthenticated && !isLoggedOut,
    fromURL
  };
  
  res.render("contact-govuk-one-login/index.njk", data);
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
