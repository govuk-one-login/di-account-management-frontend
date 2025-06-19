import { Request, Response } from "express";
import {
  getAppEnv,
  getClientsToShowInSearch,
  getResultsPerServicePage,
} from "../../config";
import { LOCALE } from "../../app.constants";

const TEMPLATE_NAME = "search-services/index.njk";
const ITEMS_PER_PAGE = getResultsPerServicePage();

const prepareForSearch = (q: string): string => {
  return q.toLowerCase().replace(/[^0-9a-z]/gi, "");
};

const paginate = (
  items: string[],
  page: number,
  itemsPerPage: number
): string[] => {
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return items.slice(start, end);
};

export function searchServicesGet(req: Request, res: Response): void {
  const query = ((req.query.q || "") as string)
    .split(" ")
    .map(prepareForSearch);

  const services = getClientsToShowInSearch(req.language ?? LOCALE.EN)
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
      return a_trn.localeCompare(b_trn, req.language ?? LOCALE.EN);
    });

  const getEnglishLanguageLink = (req: Request): string => {
    const url = new URL(req.originalUrl, "http://example.com");
    url.searchParams.set("lng", LOCALE.EN);
    url.searchParams.delete("page");
    return url.pathname + url.search;
  };

  const getPageUrl = (page: number): string => {
    const url = new URL(req.originalUrl, "http://example.com");
    url.searchParams.set("page", String(page));
    return url.pathname + url.search;
  };

  const currentPage = Number(req.query.page) || 1;

  const totalPages = Math.ceil(services.length / ITEMS_PER_PAGE);
  const pagination = {
    items:
      totalPages > 1
        ? new Array(totalPages).fill(0).map((_, i) => {
            return {
              number: i + 1,
              current: i + 1 === currentPage,
              href: getPageUrl(i + 1),
            };
          })
        : [],
    previous: currentPage > 1 && {
      href: getPageUrl(currentPage - 1),
    },
    next: currentPage < totalPages && {
      href: getPageUrl(currentPage + 1),
    },
  };

  res.render(TEMPLATE_NAME, {
    env: getAppEnv(),
    services: paginate(services, Number(req.query.page) || 1, ITEMS_PER_PAGE),
    pagination,
    query: req.query.q,
    hasSearch: !!req.query.q,
    resultsCount: services.length,
    isWelsh: req.language === LOCALE.CY,
    englishLanguageLink: getEnglishLanguageLink(req),
  });
}
