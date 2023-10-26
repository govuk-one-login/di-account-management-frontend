import { NextFunction, Request, Response } from "express";
import { PATH_DATA } from "../app.constants";

export function buildUrlFromRequest(req: Request): string {
  return `${req.protocol}://${req.get("host")}${req.originalUrl}`;
}

export function appendFromUrlWhenTriagePageUrl(
  contactUsLinkUrl: string,
  fromUrl: string
): string {
  const triagePageUrlRegEx = /contact-gov-uk-one-login/;

  if (triagePageUrlRegEx.test(contactUsLinkUrl)) {
    const encodedFromUrl = encodeURIComponent(fromUrl);

    contactUsLinkUrl = `${contactUsLinkUrl}?fromURL=${encodedFromUrl}`;
  }

  return contactUsLinkUrl;
}

export function outboundContactUsLinksMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let contactUsLinkUrl = `${req.protocol}://${req.get("host")}${PATH_DATA.CONTACT.url}`;
  const fromUrl = buildUrlFromRequest(req);

  contactUsLinkUrl = appendFromUrlWhenTriagePageUrl(contactUsLinkUrl, fromUrl);

  res.locals.contactUsLinkUrl = contactUsLinkUrl;
  next();
}
