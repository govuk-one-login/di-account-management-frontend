import { Request, Response } from "express";
import { getAppEnv, getClientsToShowInSearch } from "../../config";
import { LOCALE } from "../../app.constants";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { Index } from "flexsearch";

const TEMPLATE_NAME = "search-services/index.njk";

export const getAllServices = (translate: Request["t"], locale: LOCALE) => {
  return getClientsToShowInSearch(locale)
    .map((client) => {
      const startTextKey = `clientRegistry.${getAppEnv()}.${client}.startText`;
      const startText = translate(startTextKey);
      const startTextForSearch = startText === startTextKey ? "" : startText;
      const startUrlKey = `clientRegistry.${getAppEnv()}.${client}.startUrl`;
      const startUrl = translate(startUrlKey);
      const startUrlForSearch = startUrl === startUrlKey ? "" : startUrl;
      const additionalSearchTermsKey = `clientRegistry.${getAppEnv()}.${client}.additionalSearchTerms`;
      const additionalSearchTerms = translate(additionalSearchTermsKey);
      const additionalSearchTermsForSearch =
        additionalSearchTerms === additionalSearchTermsKey
          ? ""
          : additionalSearchTerms;

      return {
        client,
        startText: startTextForSearch,
        startUrl: startUrlForSearch,
        additionalSearchTerms: additionalSearchTermsForSearch,
      };
    })
    .sort((a, b) => {
      return a.startText.localeCompare(b.startText, locale);
    });
};

const indexes: Record<string, Index> = {};

export const searchServices = (
  locale: LOCALE,
  query: string,
  services: ReturnType<typeof getAllServices>
) => {
  if (!indexes[locale]) {
    const index = new Index({
      tokenize: "forward",
    });

    services.forEach((service) => {
      const additionalSearchTerms =
        service.additionalSearchTerms !== ""
          ? ` ${service.additionalSearchTerms}`
          : "";
      index.add(service.client, `${service.startText}${additionalSearchTerms}`);
    });

    indexes[locale] = index;
  }

  return indexes[locale]
    .search(query)
    .map((clientId) => services.find((service) => service.client === clientId));
};

export function searchServicesGet(req: Request, res: Response): void {
  req.metrics?.addMetric("searchServicesGet", MetricUnit.Count, 1);

  const query = (req.query.q || "") as string;
  const locale = (req.language ?? LOCALE.EN) as LOCALE;

  let services = getAllServices(req.t, locale);

  if (query.length) {
    services = searchServices(locale, query, services);
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
