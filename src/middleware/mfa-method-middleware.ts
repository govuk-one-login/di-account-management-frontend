import { NextFunction, Request, RequestHandler, Response } from "express";
import { ERROR_MESSAGES } from "../app.constants";
import { getMfaServiceUrl, supportMfaManagement } from "../config";
import { logger } from "../utils/logger";
import { legacyMfaMethodsMiddleware } from "./mfa-methods-legacy";
import { createMfaClient, formatErrorMessage } from "../utils/mfaClient";

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
        formatErrorMessage("Failed MFA retrieve", response)
      );
    }
    next();
  } catch {
    req.log.error(
      { trace: res.locals.trace },
      ERROR_MESSAGES.FAILED_MFA_RETRIEVE_CALL
    );
    next();
  }
}

const selectMfaMiddleware = (): RequestHandler => {
  const mfaServiceUrlString = getMfaServiceUrl();
  let mfaServiceUrl: URL | null = null;
  if (mfaServiceUrlString) {
    try {
      mfaServiceUrl = new URL(mfaServiceUrlString);
    } catch {
      logger.warn(`Invalid MFA service URL: ${mfaServiceUrlString}`);
      mfaServiceUrl = null;
    }
  }

  if (supportMfaManagement() && mfaServiceUrl) {
    return mfaMethodMiddleware;
  }

  return legacyMfaMethodsMiddleware;
};

export { selectMfaMiddleware };
