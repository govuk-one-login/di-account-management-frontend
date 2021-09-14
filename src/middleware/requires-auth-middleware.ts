import { NextFunction, Request, Response } from "express";
import { PATH_DATA } from "../app.constants";

export function requiresAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isLoggedIn = req.session.user && req.session.user.isAuthenticated;

  if (!isLoggedIn) {
    return res.redirect(PATH_DATA.SESSION_EXPIRED.url);
  }

  next();
}
