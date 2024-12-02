import { Request, Response } from "express";

export function searchServicesGet(req: Request, res: Response): void {
  res.send("hello world");
}
