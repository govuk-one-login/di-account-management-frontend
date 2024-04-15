import { Request } from "express";

export function getTxmaHeader(req: Request): string {
  return (req.headers["txma-audit-encoded"] as string) ?? "";
}
