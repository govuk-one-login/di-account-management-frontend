import { NextFunction, Request, Response } from "express";
import {
  ERROR_MESSAGES,
  HTTP_STATUS_CODES,
  LogoutState,
  PATH_DATA,
} from "../app.constants";
import { EMPTY_OPL_SETTING_VALUE, setOplSettings } from "../utils/opl";
import { handleLogout } from "../utils/logout";

export async function serverErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (res.headersSent) {
    return next(err);
  }

  if (err.message === ERROR_MESSAGES.FAILED_TO_REFRESH_TOKEN) {
    await handleLogout(req, res, LogoutState.Default);
    return;
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
