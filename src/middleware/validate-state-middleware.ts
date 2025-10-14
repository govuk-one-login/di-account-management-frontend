import { NextFunction, Request, Response } from "express";
import { PATH_DATA } from "../app.constants";

export function validateStateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const pageState = Object.values(PATH_DATA).find(
    (key) => key.url === req.path
  );

  if (!req.session.user.state?.[pageState.type]) {
    req.log.info(`state exists but no value for ${pageState.type}`);
    req.log.warn(`state exists but no value for ${pageState.type}`);
    return res.redirect(PATH_DATA.YOUR_SERVICES.url);
  }

  if (
    req.session.user.state[pageState.type].events.length > 0 &&
    !req.session.user.state[pageState.type].events.includes(pageState.event)
  ) {
    delete req.session.user.state[pageState.type];
    return res.redirect(PATH_DATA.YOUR_SERVICES.url);
  }

  next();
}
