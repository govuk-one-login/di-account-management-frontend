import { Request, Response } from "express";
import { getAppEnv, getClientsToShowInSearch } from "../../config";
import { LOCALE } from "../../app.constants";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { Worker, Index } from "flexsearch";
import { getTranslations } from "di-account-management-rp-registry";

const TEMPLATE_NAME = "search-services/index.njk";

const translations = {
  [LOCALE.EN]: getTranslations(getAppEnv(), LOCALE.EN),
  [LOCALE.CY]: getTranslations(getAppEnv(), LOCALE.CY),
};

export const getAllServices = (translate: Request["t"], locale: LOCALE) => {
  const env = getAppEnv();
  return getClientsToShowInSearch(locale)
    .map((clientId) => {
      const startTextKey = `clientRegistry.${env}.${clientId}.startText`;
      const startText = translate(startTextKey);
      const startTextForSearch = startText === startTextKey ? "" : startText;
      const startUrlKey = `clientRegistry.${env}.${clientId}.startUrl`;
      const startUrl = translate(startUrlKey);
      const startUrlForSearch = startUrl === startUrlKey ? "" : startUrl;

      let additionalSearchTerms: string;

      if (translations[locale][clientId]?.additionalSearchTerms) {
        const additionalSearchTermsKey = `clientRegistry.${env}.${clientId}.additionalSearchTerms`;
        additionalSearchTerms = translate(additionalSearchTermsKey);
      } else {
        additionalSearchTerms = "";
      }
      return {
        clientId,
        startText: startTextForSearch,
        startUrl: startUrlForSearch,
        additionalSearchTerms: additionalSearchTerms,
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
  const index = await new Worker({
    tokenize: "forward",
  });

  const lotsOfServices = [
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
    ...services,
  ];

  await Promise.all(
    lotsOfServices.map((service, i) => {
      const additionalSearchTerms =
        service.additionalSearchTerms !== ""
          ? ` ${service.additionalSearchTerms}`
          : "";
      return index.add(
        `${service.clientId}_${i}`,
        `${i}${service.startText}${additionalSearchTerms}`
      );
    })
  );

  indexes[locale] = index;
};

export const searchServices = async (
  locale: LOCALE,
  query: string,
  services: ReturnType<typeof getAllServices>
) => {
  return (await indexes[locale].searchAsync(query)).map((clientId) =>
    services.find((service) => service.clientId === clientId)
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
