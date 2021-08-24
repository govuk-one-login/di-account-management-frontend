import { NextFunction, Request, Response } from "express";

export function requiresAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requiresLogin = !req.oidc || !req.session.user;

  if (requiresLogin) {
    return res.redirect("/");
  }

  next();
}
