import { Request, Response } from "express";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { logger } from "../../utils/logger.js";

export const UNKNOWN_ERROR_MESSAGE = "UnkownError";

export function errorGet(req: Request, res: Response): Promise<void> {
  req.metrics?.addMetric("errorGet", MetricUnit.Count, 1);

  const message =
    typeof req.query.msg === "string" ? req.query.msg : UNKNOWN_ERROR_MESSAGE;

  logger.error({ trace: res.locals.trace }, message);
  throw new Error(message);
}
