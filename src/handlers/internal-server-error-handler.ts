import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS_CODES, PATH_DATA } from "../app.constants";

export function serverErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  if (
    res.statusCode === HTTP_STATUS_CODES.UNAUTHORIZED ||
    res.statusCode == HTTP_STATUS_CODES.FORBIDDEN
  ) {
    return res.redirect(PATH_DATA.SESSION_EXPIRED.url);
  }

  res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
  res.render("common/errors/500.njk");
}
