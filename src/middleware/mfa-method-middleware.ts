import { NextFunction, Request, Response } from "express";
import { ERROR_MESSAGES } from "../app.constants";
import mfa from "../utils/mfa";

export async function mfaMethodMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  delete req.session.mfaMethods;
  try {
    const { email } = req.session.user;
    const { accessToken } = req.session.user.tokens;
    const response = await mfa(
      accessToken,
      email,
      req.ip,
      res.locals.sessionId,
      res.locals.persistentSessionId
    );
    req.session.mfaMethods = {
      ...response,
    };
    next();
  } catch (e) {
    req.log.info(
      { trace: res.locals.trace },
      ERROR_MESSAGES.FAILED_MFA_RETRIEVE_CALL
    );
    next();
  }
}
