import { NextFunction, Request, Response } from "express";
import { PATH_DATA } from "../app.constants.js";

export function buildUrlFromRequest(req: Request): string {
  const url = new URL(`${req.protocol}://${req.get("host")}${req.originalUrl}`);
  const fromURLParam = url.searchParams.get("fromURL");
  if (fromURLParam) {
    return fromURLParam;
  }
  return url.toString();
}

export function appendFromUrlWhenTriagePageUrl(
  contactUsLinkUrl: string,
  fromUrl: string
): string {
  if (contactUsLinkUrl.includes("contact-gov-uk-one-login")) {
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
  let contactUsLinkUrl = `${req.protocol}://${req.get("host")}${
    PATH_DATA.CONTACT.url
  }`;
  const fromUrl = buildUrlFromRequest(req);

  contactUsLinkUrl = appendFromUrlWhenTriagePageUrl(contactUsLinkUrl, fromUrl);

  res.locals.contactUsLinkUrl = contactUsLinkUrl;
  next();
}
