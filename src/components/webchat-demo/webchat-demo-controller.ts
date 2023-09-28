import { Request, Response } from "express";

export function webchatGet(req: Request, res: Response): void {
  const data = {};

  res.render("webchat-demo/index.njk", data);
}
