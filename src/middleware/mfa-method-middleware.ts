import { NextFunction, Request, RequestHandler, Response } from "express";
import { ERROR_MESSAGES } from "../app.constants";
import { getMfaServiceUrl, supportMfaPage } from "../config";
import { logger } from "../utils/logger";
import { legacyMfaMethodsMiddleware } from "./mfa-methods-legacy";
import { createMfaClient } from "../utils/mfaClient";

export async function mfaMethodMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const mfaClient = createMfaClient(req, res);
    const response = await mfaClient.retrieve();

    if (response.success) {
      req.session.mfaMethods = response.data;
    } else {
      req.log.error(
        { trace: res.locals.trace },
        `Failed MFA retrieve with error: ${response.problem.title}`
      );
    }
    next();
  } catch (error) {
    req.log.error(
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
