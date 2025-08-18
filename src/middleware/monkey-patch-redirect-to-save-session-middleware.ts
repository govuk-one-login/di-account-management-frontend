import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export function monkeyPatchRedirectToSaveSessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Here we monkey-patch res.redirect to defer calling it until after the session has been saved.
  // This prevents race conditions where the user follows a redirect response and the
  // subsequent request reads session before the changes to the session made in the previous
  // request have been saved.
  const originalRedirect = res.redirect;

  res.redirect = (...args: [number, string] | [string]) => {
    const stack = new Error().stack;

    const redirect = () => {
      if (!res.headersSent) {
        originalRedirect.call(res, ...args);
      } else {
        logger.warn(
          { trace: res?.locals?.trace, stack, path: req.path },
          "Unable to redirect as headers are already sent"
        );
      }
    };

    if (req.session) {
      req.session.save(() => {
        redirect();
      });
    } else {
      redirect();
    }
  };
  next();
}
