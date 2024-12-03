import { Request, Response } from "express";
import { getSearchableClientsList } from "../../utils/yourServices";
import { getAppEnv } from "../../config";

const TEMPLATE_NAME = "search-services/index.njk";

export function searchServicesGet(req: Request, res: Response): void {
  const query = ((req.query.q || "") as string).split(" ").map((q) => {
    return q.toLowerCase().replace(/[^0-9a-z]/gi, "");
  });
  const services = getSearchableClientsList().filter((service) => {
    if (!query) return true;

    const serviceName = req
      .t(`clientRegistry.${getAppEnv()}.${service}.header`)
      .toLowerCase()
      .replace(/[^0-9a-z]/gi, "");

    for (const q of query) {
      if (serviceName.includes(q)) {
        return true;
      }
    }

    return false;
  });
  res.render(TEMPLATE_NAME, {
    env: getAppEnv(),
    services,
    query: req.query.q,
    hasSearch: !!req.query.q,
    resultsCount: services.length,
  });
}
