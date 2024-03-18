import { Request } from "express";

export function getCurrentUrl(req: Request): URL {
  return new URL(req.protocol + "://" + req.get("host") + req.originalUrl);
}
