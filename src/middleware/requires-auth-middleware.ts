import { NextFunction, Request, Response } from "express";
import { PATH_DATA } from "../app.constants";

export function requiresAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isAuthenticated = req.session.user?.isAuthenticated;
  const isLoggedOut = req.cookies?.lo;

  if (!isAuthenticated && isLoggedOut == "true") {
    return res.redirect(PATH_DATA.USER_SIGNED_OUT.url);
  } else if (!isAuthenticated) {
    return res.redirect(PATH_DATA.SESSION_EXPIRED.url);
  } else {
    res.cookie("lo", "false");
    next();
  }
}
