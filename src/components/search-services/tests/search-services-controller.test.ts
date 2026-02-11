import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import {
  getAllServices,
  searchServices,
  searchServicesGet,
  createSearchIndex,
  recreateSearchIndexes,
} from "../search-services-controller.js";
import * as controller from "../search-services-controller.js";
import { LOCALE } from "../../../app.constants";
import * as config from "../../../config.js";
import * as registry from "di-account-management-rp-registry";
import i18next from "i18next";
import * as safeTranslateModule from "../../../utils/safeTranslate.js";

describe("getAllServices", () => {
  let mockTranslate: ReturnType<typeof vi.fn>;
  let getClientsToShowInSearchStub: ReturnType<typeof vi.fn>;
  let getAppEnvStub: ReturnType<typeof vi.fn>;
  let getTranslationsStub: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTranslate = vi.fn((key: string) => key);
    getClientsToShowInSearchStub = vi.spyOn(config, "getClientsToShowInSearch");
    getAppEnvStub = vi.spyOn(config, "getAppEnv");
    getTranslationsStub = vi.spyOn(registry, "getTranslations");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return services with translated text for English locale", () => {
    getAppEnvStub.mockReturnValue("dev");
    getClientsToShowInSearchStub.mockReturnValue([
      {
        clientId: "dbs",
        alternativeClients: [],
      },
      {
        clientId: "client2",
        alternativeClients: [],
      },
    ]);
    getTranslationsStub.mockReturnValue({
      dbs: {
        additionalSearchTerms: "terms1",
      },
      client2: {},
    });

    mockTranslate.mockImplementation((key: string) => {
      if (key === "clientRegistry.dev.dbs.startText") return "Service 1";
      if (key === "clientRegistry.dev.dbs.startUrl")
        return "https://service1.gov.uk";
      if (key === "clientRegistry.dev.dbs.additionalSearchTerms")
        return "terms1";
      if (key === "clientRegistry.dev.client2.startText") return "Service 2";
      if (key === "clientRegistry.dev.client2.startUrl")
        return "https://service2.gov.uk";
      return key;
    });

    const result = getAllServices(mockTranslate, LOCALE.EN);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      clientId: "dbs",
      startText: "Service 1",
      startUrl: "https://service1.gov.uk",
      additionalSearchTerms: "terms1",
    });
    expect(result[1]).toEqual({
      clientId: "client2",
      startText: "Service 2",
      startUrl: "https://service2.gov.uk",
      additionalSearchTerms: "",
    });
  });

  it("should return empty strings when translation keys are not found", () => {
    getAppEnvStub.mockReturnValue("dev");
    getClientsToShowInSearchStub.mockReturnValue([
      {
        clientId: "client1",
        alternativeClients: [],
      },
    ]);

    mockTranslate.mockImplementation((key: string) => key);

    const result = getAllServices(mockTranslate, LOCALE.EN);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      clientId: "client1",
      startText: "",
      startUrl: "",
      additionalSearchTerms: "",
    });
  });

  it("should sort services alphabetically by startText", () => {
    getAppEnvStub.mockReturnValue("dev");
    getClientsToShowInSearchStub.mockReturnValue([
      { clientId: "client1", alternativeClients: [] },
      { clientId: "client2", alternativeClients: [] },
      { clientId: "client3", alternativeClients: [] },
    ]);

    mockTranslate.mockImplementation((key: string) => {
      if (key === "clientRegistry.dev.client1.startText")
        return "Zebra Service";
      if (key === "clientRegistry.dev.client1.startUrl") return "";
      if (key === "clientRegistry.dev.client1.additionalSearchTerms") return "";
      if (key === "clientRegistry.dev.client2.startText")
        return "Alpha Service";
      if (key === "clientRegistry.dev.client2.startUrl") return "";
      if (key === "clientRegistry.dev.client2.additionalSearchTerms") return "";
      if (key === "clientRegistry.dev.client3.startText") return "Beta Service";
      if (key === "clientRegistry.dev.client3.startUrl") return "";
      if (key === "clientRegistry.dev.client3.additionalSearchTerms") return "";
      return key;
    });

    const result = getAllServices(mockTranslate, LOCALE.EN);

    expect(result).toHaveLength(3);
    expect(result[0]?.startText).toBe("Alpha Service");
    expect(result[1].startText).toBe("Beta Service");
    expect(result[2].startText).toBe("Zebra Service");
  });

  it("should work with Welsh locale", () => {
    getAppEnvStub.mockReturnValue("dev");
    getClientsToShowInSearchStub.mockReturnValue([
      {
        clientId: "dbs",
        alternativeClients: [],
      },
    ]);
    getTranslationsStub.mockReturnValue({
      dbs: {
        additionalSearchTerms: "termau1",
      },
      client2: {},
    });

    mockTranslate.mockImplementation((key: string) => {
      if (key === "clientRegistry.dev.dbs.startText") return "Gwasanaeth 1";
      if (key === "clientRegistry.dev.dbs.startUrl")
        return "https://gwasanaeth1.gov.uk";
      if (key === "clientRegistry.dev.dbs.additionalSearchTerms")
        return "termau1";
      return key;
    });

    const result = getAllServices(mockTranslate, LOCALE.CY);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      clientId: "dbs",
      startText: "Gwasanaeth 1",
      startUrl: "https://gwasanaeth1.gov.uk",
      additionalSearchTerms: "termau1",
    });
    expect(getClientsToShowInSearchStub).toHaveBeenCalledWith(LOCALE.CY);
  });

  it("should handle empty client list", () => {
    getAppEnvStub.mockReturnValue("dev");
    getClientsToShowInSearchStub.mockReturnValue([]);

    const result = getAllServices(mockTranslate, LOCALE.EN);

    expect(result).toHaveLength(0);
  });

  it("should handle clients with alternativeClients", () => {
    getAppEnvStub.mockReturnValue("dev");
    getClientsToShowInSearchStub.mockReturnValue([
      {
        clientId: "client1",
        alternativeClients: [
          {
            [LOCALE.EN]: {
              startText: "Alt Service 1",
              startUrl: "https://alt1.gov.uk",
              additionalSearchTerms: "alt terms 1",
            },
            [LOCALE.CY]: {
              startText: "Gwasanaeth Alt 1",
              startUrl: "https://alt1.gov.uk/cy",
            },
          },
        ],
      },
    ]);

    mockTranslate.mockImplementation((key: string) => {
      if (key === "clientRegistry.dev.client1.startText")
        return "Main Service 1";
      if (key === "clientRegistry.dev.client1.startUrl")
        return "https://main1.gov.uk";
      if (key === "clientRegistry.dev.client1.additionalSearchTerms") return "";
      return key;
    });

    const result = getAllServices(mockTranslate, LOCALE.EN);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      clientId: "client1_alt_0",
      startText: "Alt Service 1",
      startUrl: "https://alt1.gov.uk",
      additionalSearchTerms: "alt terms 1",
    });
    expect(result[1]).toEqual({
      clientId: "client1",
      startText: "Main Service 1",
      startUrl: "https://main1.gov.uk",
      additionalSearchTerms: "",
    });
  });

  it("should handle cases where alternativeClients lack additionalSearchTerms", () => {
    getAppEnvStub.mockReturnValue("dev");
    getClientsToShowInSearchStub.mockReturnValue([
      {
        clientId: "client1",
        alternativeClients: [
          {
            [LOCALE.EN]: {
              startText: "Alt Service 1",
              startUrl: "https://alt1.gov.uk",
            },
          },
        ],
      },
    ]);

    mockTranslate.mockImplementation((key: string) => {
      if (key === "clientRegistry.dev.client1.startText")
        return "Main Service 1";
      if (key === "clientRegistry.dev.client1.startUrl")
        return "https://main1.gov.uk";
      if (key === "clientRegistry.dev.client1.additionalSearchTerms") return "";
      return key;
    });

    const result = getAllServices(mockTranslate, LOCALE.EN);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      clientId: "client1_alt_0",
      startText: "Alt Service 1",
      startUrl: "https://alt1.gov.uk",
      additionalSearchTerms: "",
    });
    expect(result[1]).toEqual({
      clientId: "client1",
      startText: "Main Service 1",
      startUrl: "https://main1.gov.uk",
      additionalSearchTerms: "",
    });
  });

  it("should exlude alternativeClients missing startText or startUrl", () => {
    getAppEnvStub.mockReturnValue("dev");
    getClientsToShowInSearchStub.mockReturnValue([
      {
        clientId: "client1",
        alternativeClients: [
          {
            [LOCALE.EN]: {
              startText: "Alt Service 1",
              startUrl: "https://alt1.gov.uk",
            },
          },
          {
            [LOCALE.EN]: {
              startUrl: "https://alt2.gov.uk",
            },
          },
          {
            [LOCALE.EN]: {
              startText: "Alt Service 3",
            },
          },
        ],
      },
    ]);

    mockTranslate.mockImplementation((key: string) => {
      if (key === "clientRegistry.dev.client1.startText")
        return "Main Service 1";
      if (key === "clientRegistry.dev.client1.startUrl")
        return "https://main1.gov.uk";
      if (key === "clientRegistry.dev.client1.additionalSearchTerms") return "";
      return key;
    });

    const result = getAllServices(mockTranslate, LOCALE.EN);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      clientId: "client1_alt_0",
      startText: "Alt Service 1",
      startUrl: "https://alt1.gov.uk",
      additionalSearchTerms: "",
    });
    expect(result[1]).toEqual({
      clientId: "client1",
      startText: "Main Service 1",
      startUrl: "https://main1.gov.uk",
      additionalSearchTerms: "",
    });
  });
});

describe("createSearchIndex", () => {
  let i18nextStub: ReturnType<typeof vi.spyOn>;
  let safeTranslateStub: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    i18nextStub = vi.spyOn(i18next, "getFixedT");
    safeTranslateStub = vi.spyOn(safeTranslateModule, "safeTranslate");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create index when createIfDoesntExist is true and index doesn't exist", async () => {
    const mockTranslate = vi.fn((key: string) => key);
    i18nextStub.mockReturnValue(mockTranslate as any);
    safeTranslateStub.mockImplementation((translate, key) => translate(key));

    await createSearchIndex(LOCALE.EN, true, false);

    expect(i18nextStub).toHaveBeenCalledWith(LOCALE.EN);
  });

  it("should not create index when createIfDoesntExist is false and index doesn't exist", async () => {
    await createSearchIndex(LOCALE.EN, false, false);

    expect(i18nextStub).not.toHaveBeenCalled();
  });
});

describe("searchServices", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return empty array when no matches found", async () => {
    const mockServices = [
      {
        clientId: "client1",
        startText: "Tax Service",
        startUrl: "https://tax.gov.uk",
        additionalSearchTerms: "HMRC revenue",
      },
    ];

    const result = await searchServices(LOCALE.EN, "nonexistent", mockServices);

    expect(result).toHaveLength(0);
  });

  it("should handle empty query", async () => {
    const mockServices = [
      {
        clientId: "client1",
        startText: "Tax Service",
        startUrl: "https://tax.gov.uk",
        additionalSearchTerms: "HMRC revenue",
      },
    ];

    const result = await searchServices(LOCALE.EN, "", mockServices);

    expect(result).toHaveLength(0);
  });

  it("should handle empty services array", async () => {
    const result = await searchServices(LOCALE.EN, "tax", []);

    expect(result).toHaveLength(0);
  });
});

describe("searchServicesGet", () => {
  let mockReq: any;
  let mockRes: any;
  let searchServicesStub: ReturnType<typeof vi.spyOn>;
  let getAppEnvStub: ReturnType<typeof vi.spyOn>;
  let i18nextStub: ReturnType<typeof vi.spyOn>;
  let safeTranslateStub: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    searchServicesStub = vi.spyOn(controller, "searchServices");
    getAppEnvStub = vi.spyOn(config, "getAppEnv");
    i18nextStub = vi.spyOn(i18next, "getFixedT");
    safeTranslateStub = vi.spyOn(safeTranslateModule, "safeTranslate");

    const mockTranslate = vi.fn((key: string) => key);
    i18nextStub.mockReturnValue(mockTranslate as any);
    safeTranslateStub.mockImplementation((translate, key) => translate(key));

    mockReq = {
      query: {},
      language: LOCALE.EN,
      originalUrl: "/search",
      t: vi.fn(),
      metrics: { addMetric: vi.fn() },
    };

    mockRes = {
      render: vi.fn(),
      locals: {},
    };

    getAppEnvStub.mockReturnValue("dev");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render all services when no query provided", async () => {
    await searchServicesGet(mockReq, mockRes);

    expect(searchServicesStub).not.toHaveBeenCalled();
    expect(mockRes.render).toHaveBeenCalledWith(
      "search-services/index.njk",
      expect.objectContaining({
        env: "dev",
        query: "",
        hasSearch: false,
        isWelsh: false,
        englishLanguageLink: "/search?lng=en",
      })
    );
  });

  it("should search services when query provided", async () => {
    mockReq.query.q = "service";

    await searchServicesGet(mockReq, mockRes);

    expect(mockRes.render).toHaveBeenCalledWith(
      "search-services/index.njk",
      expect.objectContaining({
        env: "dev",
        query: "service",
        hasSearch: true,
        isWelsh: false,
        englishLanguageLink: "/search?lng=en",
      })
    );
  });

  it("should handle Welsh locale", async () => {
    mockReq.language = LOCALE.CY;

    await searchServicesGet(mockReq, mockRes);

    expect(mockRes.render).toHaveBeenCalledWith(
      "search-services/index.njk",
      expect.objectContaining({
        isWelsh: true,
      })
    );
  });

  it("should default to English when no language set", async () => {
    mockReq.language = undefined;

    await searchServicesGet(mockReq, mockRes);

    expect(mockRes.render).toHaveBeenCalledWith(
      "search-services/index.njk",
      expect.objectContaining({
        isWelsh: false,
      })
    );
  });

  it("should add metrics", async () => {
    await searchServicesGet(mockReq, mockRes);

    expect(mockReq.metrics.addMetric).toHaveBeenCalledWith(
      "searchServicesGet",
      "Count",
      1
    );
  });

  it("should handle missing metrics gracefully", () => {
    mockReq.metrics = undefined;

    expect(() => searchServicesGet(mockReq, mockRes)).not.toThrow();
  });

  it("should preserve existing query params except q in English link", async () => {
    mockReq.originalUrl = "/search?param=value&q=test";

    await searchServicesGet(mockReq, mockRes);

    expect(mockRes.render).toHaveBeenCalledWith(
      "search-services/index.njk",
      expect.objectContaining({
        englishLanguageLink: "/search?param=value&lng=en",
      })
    );
  });
});

describe("recreateSearchIndexes", () => {
  it("should set up timers for both locales", () => {
    vi.useFakeTimers({ now: new Date("2023-01-01T10:59:59.000Z") });

    const setTimeoutSpy = vi.spyOn(global, "setTimeout");

    recreateSearchIndexes();

    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
    expect(setTimeoutSpy).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Number)
    );

    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should schedule periodic index recreation", () => {
    vi.useFakeTimers({ now: new Date("2023-01-01T10:59:59.000Z") });

    const setTimeoutSpy = vi.spyOn(global, "setTimeout");
    const setIntervalSpy = vi.spyOn(global, "setInterval");
    const createSearchIndexSpy = vi.spyOn(controller, "createSearchIndex");
    const i18nextStub = vi.spyOn(i18next, "getFixedT");
    const safeTranslateStub = vi.spyOn(safeTranslateModule, "safeTranslate");

    const mockTranslate = vi.fn((key: string) => key);
    i18nextStub.mockReturnValue(mockTranslate as any);
    safeTranslateStub.mockImplementation((translate, key) => translate(key));
    createSearchIndexSpy.mockResolvedValue(undefined);

    recreateSearchIndexes();

    expect(setTimeoutSpy).toHaveBeenCalled();

    const timeoutCallback = setTimeoutSpy.mock.calls[0][0] as () => void;
    timeoutCallback();

    expect(setIntervalSpy).toHaveBeenCalledWith(
      expect.any(Function),
      60 * 60 * 1000
    );

    vi.restoreAllMocks();
    vi.useRealTimers();
  });
});
