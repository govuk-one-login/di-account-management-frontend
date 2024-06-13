import { Request } from "express";
import { logger } from "./logger.js";

export function getTxmaHeader(req: Request, trace: string): string | undefined {
  if (req.headers["txma-audit-encoded"]) {
    return req.headers["txma-audit-encoded"] as string;
  } else {
    logger.warn({ trace: trace }, "Missing Txma-Audit-Encoded header");
  }
}
