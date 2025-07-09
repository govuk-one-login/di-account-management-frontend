import { NextFunction, Request, Response } from "express";
import { ERROR_MESSAGES } from "../app.constants";
import { getMfaServiceUrl, supportMfaManagement } from "../config";
import { logger } from "../utils/logger";
import { runLegacyMfaMethodsMiddleware } from "./mfa-methods-legacy";
import { createMfaClient, formatErrorMessage } from "../utils/mfaClient";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

async function runMfaMethodMiddleware(
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
  } catch (error) {
    req.metrics?.addMetric("runMfaMethodMiddlewareError", MetricUnit.Count, 1);
    req.log.error(
      { trace: res.locals.trace },
      ERROR_MESSAGES.FAILED_MFA_RETRIEVE_CALL
    );
    next(error);
  }
}

export async function mfaMethodMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
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

  if (supportMfaManagement(req.cookies) && mfaServiceUrl) {
    await runMfaMethodMiddleware(req, res, next);
  } else {
    runLegacyMfaMethodsMiddleware(req, res, next);
  }
}
