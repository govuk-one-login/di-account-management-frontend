import { NextFunction, Request, Response } from "express";
import { ERROR_MESSAGES } from "../app.constants.js";
import {
  createMfaClient,
  formatErrorMessage,
} from "../utils/mfaClient/index.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { shouldLogError } from "../utils/shouldLogError.js";

export async function mfaMethodMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const mfaClient = await createMfaClient(req, res);
    const response = await mfaClient.retrieve();

    if (!response.success) {
      throw new Error(formatErrorMessage("Failed MFA retrieve", response));
    }

    req.session.mfaMethods = response.data;
    next();
  } catch (error) {
    req.metrics?.addMetric("runMfaMethodMiddlewareError", MetricUnit.Count, 1);
    if (shouldLogError(error)) {
      req.log.error(
        error,
        { trace: res.locals.trace },
        ERROR_MESSAGES.FAILED_MFA_RETRIEVE_CALL
      );
    }
    next(error);
  }
}
