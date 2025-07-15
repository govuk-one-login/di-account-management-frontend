import { Request, Response } from "express";
import { getAppEnv, getClientsToShowInSearch } from "../../config";
import { LOCALE } from "../../app.constants";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
// @ts-expect-error - fuse.js doesn't have types available
import Fuse from "fuse.js/basic";

const TEMPLATE_NAME = "search-services/index.njk";

export function searchServicesGet(req: Request, res: Response): void {
  req.metrics?.addMetric("searchServicesGet", MetricUnit.Count, 1);
  const query = (req.query.q ?? "") as string;
  const locale = req.language ?? LOCALE.EN;

  let services = getClientsToShowInSearch(locale)
    .map((service) => ({
      startUrl: req.t(`clientRegistry.${getAppEnv()}.${service}.startUrl`),
      startText: req.t(`clientRegistry.${getAppEnv()}.${service}.startText`),
      additionalSearchTerms:
        req.t(
          `clientRegistry.${getAppEnv()}.${service}.additionalSearchTerms`
        ) === `clientRegistry.${getAppEnv()}.${service}.additionalSearchTerms`
          ? ""
          : req.t(
              `clientRegistry.${getAppEnv()}.${service}.additionalSearchTerms`
            ),
    }))
    .sort((a, b) => {
      return a.startText.localeCompare(b.startText, locale);
    });

  if (query.trim().length) {
    const fuse = new Fuse(services, {
      keys: ["startText", "additionalSearchTerms"],
      findAllMatches: true,
    });

    services = fuse.search(query).map((service: any) => ({
      ...service.item,
    }));
  }

  const url = new URL(req.originalUrl, "http://example.com");
  url.searchParams.set("lng", LOCALE.EN);
  url.searchParams.delete("q");
  const englishLanguageLink = url.pathname + url.search;

  res.render(TEMPLATE_NAME, {
    env: getAppEnv(),
    services,
    query,
    hasSearch: !!req.query.q,
    resultsCount: services.length,
    isWelsh: req.language === LOCALE.CY,
    englishLanguageLink,
  });
}
