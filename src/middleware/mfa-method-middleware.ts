import { NextFunction, Request, RequestHandler, Response } from "express";
import { ERROR_MESSAGES } from "../app.constants.js";
import retrieveMfaMethods from "../utils/mfa/index.js";
import { getMfaServiceUrl, supportMfaPage } from "../config.js";
import { logger } from "../utils/logger.js";
import { legacyMfaMethodsMiddleware } from "./mfa-methods-legacy.js";

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
      res.locals.persistentSessionId
    );
    req.session.mfaMethods = [...response];
    next();
  } catch (e) {
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
  } catch (e) {
    logger.error(`selectMfaMiddleware ${e.message}`);
  }
  return legacyMfaMethodsMiddleware;
};

export { selectMfaMiddleware };
