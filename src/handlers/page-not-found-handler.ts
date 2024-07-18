import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS_CODES } from "../app.constants";
import { getBaseUrl } from "../config";
import isUserLoggedIn from "../utils/isUserLoggedIn";

export function pageNotFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next();
  }

  const data = {
    homepageButtonLink: getBaseUrl(),
    showSignOut: isUserLoggedIn(req),
  };
  res.status(HTTP_STATUS_CODES.NOT_FOUND);
  res.render("common/errors/404.njk", data);
}
