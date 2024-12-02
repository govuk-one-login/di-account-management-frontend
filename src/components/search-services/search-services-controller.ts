import { Request, Response } from "express";
import { getSearchableClientsList } from "../../utils/yourServices";
import { getAppEnv } from "../../config";

const TEMPLATE_NAME = "search-services/index.njk";

export function searchServicesGet(req: Request, res: Response): void {
  const services = getSearchableClientsList();
  res.render(TEMPLATE_NAME, {
    env: getAppEnv(),
    services,
  });
}
