import { NextFunction, Request, Response } from "express";
export function languageToggleMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.i18n) {
    res.locals.htmlLang = req.i18n.language;
  }

  next();
}
