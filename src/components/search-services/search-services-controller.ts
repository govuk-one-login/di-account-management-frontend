import { Request, Response } from "express";
import { getAppEnv, getClientsToShowInSearch } from "../../config";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

const TEMPLATE_NAME = "search-services/index.njk";

const prepareForSearch = (q: string): string => {
  return q.toLowerCase().replace(/[^0-9a-z]/gi, "");
};

export function searchServicesGet(req: Request, res: Response): void {
  req.metrics?.addMetric("searchServicesGet", MetricUnit.Count, 1);
  const query = ((req.query.q || "") as string)
    .split(" ")
    .map(prepareForSearch);

  const services = getClientsToShowInSearch()
    .filter((service) => {
      if (query.length === 0) return true;

      const serviceName = prepareForSearch(
        req.t(`clientRegistry.${getAppEnv()}.${service}.header`)
      );

      for (const q of query) {
        if (serviceName.includes(q)) {
          return true;
        }
      }

      return false;
    })
    .sort((a, b) => {
      const a_trn = req.t(`clientRegistry.${getAppEnv()}.${a}.header`);
      const b_trn = req.t(`clientRegistry.${getAppEnv()}.${b}.header`);
      return a_trn.localeCompare(b_trn, req.language || "en");
    });

  res.render(TEMPLATE_NAME, {
    env: getAppEnv(),
    services,
    query: req.query.q,
    hasSearch: !!req.query.q,
    resultsCount: services.length,
  });
}
