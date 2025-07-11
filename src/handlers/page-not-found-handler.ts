import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS_CODES } from "../app.constants";
import { EMPTY_OPL_SETTING_VALUE, setOplSettings } from "../utils/opl";

export function pageNotFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next();
  }

  setOplSettings(
    {
      taxonomyLevel2: EMPTY_OPL_SETTING_VALUE,
    },
    res
  );

  res.status(HTTP_STATUS_CODES.NOT_FOUND);
  res.render("common/errors/404.njk");
}
