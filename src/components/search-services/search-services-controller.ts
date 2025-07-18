import { Request, Response } from "express";
import { getAppEnv, getClientsToShowInSearch } from "../../config";
import { LOCALE } from "../../app.constants";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { Worker, Index } from "flexsearch";

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

const indexes: Record<string, Index<true, false, true>> = {};

// This is called on every GET request but because the indexes are module
// scoped and are only created on the first request for a particular locale this
// is okay. This first request is slightly slower as the index is created. Index
// creation with ~10,000 items has been tested and the request time is acceptable.
// ~100,000 is less acceptable but we are very unlikely to hit 10,000 items let alone
// 100,000 items.
export const createSearchIndex = async (
  locale: LOCALE,
  services: ReturnType<typeof getAllServices>
) => {
  if (!indexes[locale]) {
    const index = await new Worker({
      tokenize: "forward",
    });

    await Promise.all(
      services.map((service) => {
        const additionalSearchTerms =
          service.additionalSearchTerms !== ""
            ? ` ${service.additionalSearchTerms}`
            : "";
        return index.add(
          service.client,
          `${service.startText}${additionalSearchTerms}`
        );
      })
    );

    indexes[locale] = index;
  }
};

export const searchServices = async (
  locale: LOCALE,
  query: string,
  services: ReturnType<typeof getAllServices>
) => {
  return (await indexes[locale].searchAsync(query)).map((clientId) =>
    services.find((service) => service.client === clientId)
  );
};

export async function searchServicesGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("searchServicesGet", MetricUnit.Count, 1);

  const query = (req.query.q || "") as string;
  const locale = (req.language ?? LOCALE.EN) as LOCALE;

  let services = getAllServices(req.t, locale);

  await createSearchIndex(locale, services);

  if (query.length) {
    services = await searchServices(locale, query, services);
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
