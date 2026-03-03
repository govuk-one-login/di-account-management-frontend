import { Request, Response, NextFunction } from "express";
import { getJWKS } from "./jwks-service.js";

export async function jwksGet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const jwks = await getJWKS();
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json(jwks);
  } catch (error) {
    next(error);
  }
}
