import { Request, Response } from "express";
import { getAppEnv, getClientsToShowInSearch } from "../../config";
import { LOCALE } from "../../app.constants";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { Worker, Index } from "flexsearch";
import { getTranslations } from "di-account-management-rp-registry";
import i18next, { TFunction } from "i18next";
import { safeTranslate } from "../../utils/safeTranslate";
import { setOplSettings } from "../../utils/opl";

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

export const createSearchIndex = async (
  locale: LOCALE,
  createIfDoesntExist: boolean,
  recreateIfExists: boolean
) => {
  if (
    (!indexes[locale] && createIfDoesntExist) ||
    (indexes[locale] && recreateIfExists)
  ) {
    const translate: TFunction<"translation", undefined> =
      i18next.getFixedT(locale);
    const t = (key: string) => safeTranslate(translate, key, locale) as string;

    const services = getAllServices(t, locale);

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
          service.clientId,
          `${service.startText}${additionalSearchTerms}`
        );
      })
    );

    indexes[locale] = index;
  }
};

export const recreateSearchIndexes = () => {
  for (const locale of Object.values(LOCALE)) {
    const now = new Date();
    const delay = 60 * 60 * 1000; // 1 hour in msec
    const start =
      delay -
      (now.getMinutes() * 60 + now.getSeconds()) * 1000 +
      now.getMilliseconds();

    setTimeout(() => {
      void createSearchIndex(locale, false, true);
      setInterval(() => {
        void createSearchIndex(locale, false, true);
      }, delay);
    }, start);
  }
};
recreateSearchIndexes();

export const searchServices = async (
  locale: LOCALE,
  query: string,
  services: ReturnType<typeof getAllServices>
) => {
  return (await indexes[locale].searchAsync(query)).reduce<
    ReturnType<typeof getAllServices>
  >((foundServices, clientId) => {
    const service = services.find((service) => service.clientId === clientId);
    if (service) {
      foundServices.push(service);
    }
    return foundServices;
  }, []);
};

export async function searchServicesGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("searchServicesGet", MetricUnit.Count, 1);

  const query = (req.query.q || "") as string;
  const locale = (req.language ?? LOCALE.EN) as LOCALE;

  let services = getAllServices(req.t, locale);

  await createSearchIndex(locale, true, false);

  if (query.length) {
    services = await searchServices(locale, query, services);
  }

  const url = new URL(req.originalUrl, "http://example.com");
  url.searchParams.set("lng", LOCALE.EN);
  url.searchParams.delete("q");
  const englishLanguageLink = url.pathname + url.search;

  setOplSettings(
    {
      contentId: "5d679aab-737f-4e74-a5b1-c9389e884d10",
    },
    res
  );

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
