import { NextFunction, Request, Response } from "express";

export function requiresAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requiresLogin = !req.session.user || req.session.user.isAuthenticated == false;

  if (requiresLogin) {
    return res.redirect("/");
  }

  next();
}
