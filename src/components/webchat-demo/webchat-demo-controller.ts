import { Request, Response } from "express";
import { getWebchatUrl } from "../../config";

export function webchatGet(req: Request, res: Response): void {
  const data = { webchatSource: getWebchatUrl() };

  res.render("webchat-demo/index.njk", data);
}
