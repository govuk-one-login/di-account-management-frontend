import { NextFunction, Request, RequestHandler, Response } from "express";
import { ERROR_MESSAGES } from "../app.constants";
import retrieveMfaMethods from "../utils/mfa";
import { getMfaServiceUrl, supportMfaPage } from "../config";
import { logger } from "../utils/logger";
import { legacyMfaMethodsMiddleware } from "./mfa-methods-legacy";

export async function mfaMethodMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.session.user;
    const { accessToken } = req.session.user.tokens;
    const response = await retrieveMfaMethods(
      accessToken,
      email,
      req.ip,
      res.locals.sessionId,
      res.locals.persistentSessionId,
      req.session.user.publicSubjectId
    );
    req.session.mfaMethods = [...response];
    next();
  } catch (error) {
    req.log.info(
      { trace: res.locals.trace },
      ERROR_MESSAGES.FAILED_MFA_RETRIEVE_CALL
    );
    next();
  }
}

const selectMfaMiddleware = (): RequestHandler => {
  try {
    const mfaServiceUrl = new URL(getMfaServiceUrl());
    if (supportMfaPage() && mfaServiceUrl) {
      return mfaMethodMiddleware;
    }
  } catch (error) {
    logger.error(`selectMfaMiddleware ${error.message}`);
  }
  return legacyMfaMethodsMiddleware;
};

export { selectMfaMiddleware };
