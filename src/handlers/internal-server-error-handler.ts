import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS_CODES, PATH_DATA } from "../app.constants";
import { EMPTY_OPL_SETTING_VALUE, setOplSettings } from "../utils/opl";

export function serverErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  setOplSettings(
    {
      taxonomyLevel2: EMPTY_OPL_SETTING_VALUE,
    },
    res
  );

  if (
    res.statusCode === HTTP_STATUS_CODES.UNAUTHORIZED ||
    res.statusCode == HTTP_STATUS_CODES.FORBIDDEN
  ) {
    return res.redirect(PATH_DATA.SESSION_EXPIRED.url);
  }

  res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
  res.render("common/errors/500.njk");
}
