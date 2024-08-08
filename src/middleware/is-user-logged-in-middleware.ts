import { Request, Response, NextFunction } from "express";
import isUserLoggedIn from "../utils/isUserLoggedIn";

export const isUserLoggedInMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.locals.isUserLoggedIn = isUserLoggedIn(req);
  next();
};
