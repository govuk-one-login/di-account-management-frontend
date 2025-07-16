import { Request, Response } from "express";
import { getAppEnv, getClientsToShowInSearch } from "../../config";
import { LOCALE } from "../../app.constants";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import Fuse from "fuse.js";

const TEMPLATE_NAME = "search-services/index.njk";

export function searchServicesGet(req: Request, res: Response): void {
  req.metrics?.addMetric("searchServicesGet", MetricUnit.Count, 1);

  const query = (req.query.q || "") as string;
  const locale = req.language ?? LOCALE.EN;

  let services = getClientsToShowInSearch(locale)
    .map((client) => {
      const startTextKey = `clientRegistry.${getAppEnv()}.${client}.startText`;
      const startText = req.t(startTextKey);
      const startTextForSearch = startText === startTextKey ? "" : startText;
      const startUrlKey = `clientRegistry.${getAppEnv()}.${client}.startUrl`;
      const startUrl = req.t(startUrlKey);
      const startUrlForSearch = startUrl === startUrlKey ? "" : startUrl;
      const additionalSearchTermsKey = `clientRegistry.${getAppEnv()}.${client}.additionalSearchTerms`;
      const additionalSearchTerms = req.t(additionalSearchTermsKey);
      const additionalSearchTermsForSearch =
        additionalSearchTerms === additionalSearchTermsKey
          ? ""
          : additionalSearchTerms;

      return {
        startText: startTextForSearch,
        startUrl: startUrlForSearch,
        additionalSearchTerms: additionalSearchTermsForSearch,
      };
    })
    .sort((a, b) => {
      return a.startText.localeCompare(b.startText, locale);
    });

  if (query.length) {
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
    isWelsh: locale === LOCALE.CY,
    englishLanguageLink,
  });
}
