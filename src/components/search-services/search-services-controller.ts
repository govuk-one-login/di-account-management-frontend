import { Request, Response } from "express";

const TEMPLATE_NAME = "search-services/index.njk";

export function searchServicesGet(req: Request, res: Response): void {
  res.render(TEMPLATE_NAME, {});
}
