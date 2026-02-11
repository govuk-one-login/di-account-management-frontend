import { NextFunction, Request, Response } from "express";
import { PATH_DATA } from "../app.constants.js";

export function csrfErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    void next();
    return;
  }

  if (error.code === "EBADCSRFTOKEN") {
    req.log.info({
      msg: `Failed CSRF validation, redirecting to your services page.  Original error: ${error.message}`,
    });
    res.redirect(PATH_DATA.YOUR_SERVICES.url);
  } else {
    void next(error);
  }
}
