import { Request } from "express";
import { logger } from "./logger";

export function getTxmaHeader(req: Request, trace: string): string {
  if (req.headers["txma-audit-encoded"]) {
    return req.headers["txma-audit-encoded"] as string;
  } else {
    logger.warn({ trace: trace }, "Missing Txma-Audit-Encoded header");
    return "";
  }
}
