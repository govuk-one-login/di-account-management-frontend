import { expect } from "chai";
import { describe } from "mocha";
import { searchServicesGet } from "../search-services-controller";
import { Request, Response } from "express";
import { sinon } from "../../../../test/utils/test-utils";

import * as config from "../../../config";

const translations: Record<string, string> = {
  "clientRegistry.test.govuk.header": "gov.uk email",
  "clientRegistry.test.lite.header": "LITE (licenseing)",
  "clientRegistry.test.ofqual.header": "Ofqual subject matter",
  "clientRegistry.test.slavery.header": "Modern slavery statement registry",
  "clientRegistry.test.apprentice.header": "Manage apprenticeships",
};

const servicesMock = ["govuk", "lite", "ofqual", "slavery", "apprentice"];
const servicesMockSorted = ["govuk", "lite", "apprentice", "slavery", "ofqual"];
const servicesMockMultiplePages = new Array(25)
  .fill(0)
  .map((_, i) => `service${i + 1}`);

const getRequestMock = (q?: string, lng?: string): Partial<Request> => {
  const url = lng === "cy" ? "/search-services?lng=cy" : "/search-services";
  return {
    query: q ? { q } : {},
    originalUrl: url,
    language: lng || "en",
    t: (k: string): string => translations[k] || k,
  };
};

describe("search services controller", () => {
  let res: Partial<Response>;
  let sandbox: sinon.SinonSandbox;
  let searchStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    res = {
      render: sandbox.fake(),
    };

    searchStub = sandbox
      .stub(config, "getClientsToShowInSearch")
      .returns(servicesMock);
    sandbox.stub(config, "getAppEnv").returns("test");
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should render with correct parameters, and results in correct order", () => {
    searchServicesGet(getRequestMock() as Request, res as Response);
    expect(res.render).to.have.calledWith("search-services/index.njk", {
      env: "test",
      services: servicesMockSorted,
      query: undefined,
      hasSearch: false,
      resultsCount: 5,
      isWelsh: false,
      englishLanguageLink: "/search-services?lng=en",
      pagination: { items: [], previous: false, next: false },
    });
  });

  it("should show no results when there is a search with no results", () => {
    searchServicesGet(getRequestMock("noresults") as Request, res as Response);
    expect(res.render).to.have.calledWith("search-services/index.njk", {
      env: "test",
      services: [],
      query: "noresults",
      hasSearch: true,
      resultsCount: 0,
      isWelsh: false,
      englishLanguageLink: "/search-services?lng=en",
      pagination: { items: [], previous: false, next: false },
    });
  });

  it("should match when there is punctuation in the title, but not in the query", () => {
    searchServicesGet(getRequestMock("govuk") as Request, res as Response);
    expect(res.render).to.have.calledWith("search-services/index.njk", {
      env: "test",
      services: ["govuk"],
      query: "govuk",
      hasSearch: true,
      resultsCount: 1,
      isWelsh: false,
      englishLanguageLink: "/search-services?lng=en",
      pagination: { items: [], previous: false, next: false },
    });
  });

  it("should match when there is punctuation in the query", () => {
    searchServicesGet(getRequestMock("gov.uk") as Request, res as Response);
    expect(res.render).to.have.calledWith("search-services/index.njk", {
      env: "test",
      services: ["govuk"],
      query: "gov.uk",
      hasSearch: true,
      resultsCount: 1,
      isWelsh: false,
      englishLanguageLink: "/search-services?lng=en",
      pagination: { items: [], previous: false, next: false },
    });
  });

  it("should match multiple words in the query", () => {
    searchServicesGet(getRequestMock("gov lite") as Request, res as Response);
    expect(res.render).to.have.calledWith("search-services/index.njk", {
      env: "test",
      services: ["govuk", "lite"],
      query: "gov lite",
      hasSearch: true,
      resultsCount: 2,
      isWelsh: false,
      englishLanguageLink: "/search-services?lng=en",
      pagination: { items: [], previous: false, next: false },
    });
  });

  it("should match across words in the service header", () => {
    searchServicesGet(getRequestMock("ageappre") as Request, res as Response);
    expect(res.render).to.have.calledWith("search-services/index.njk", {
      env: "test",
      services: ["apprentice"],
      query: "ageappre",
      hasSearch: true,
      resultsCount: 1,
      isWelsh: false,
      englishLanguageLink: "/search-services?lng=en",
      pagination: { items: [], previous: false, next: false },
    });
  });

  it("should set isWelsh to true when the language is welsh", () => {
    searchServicesGet(
      getRequestMock(undefined, "cy") as Request,
      res as Response
    );
    expect(res.render).to.have.calledWith("search-services/index.njk", {
      env: "test",
      services: servicesMockSorted,
      query: undefined,
      hasSearch: false,
      resultsCount: 5,
      isWelsh: true,
      englishLanguageLink: "/search-services?lng=en",
      pagination: { items: [], previous: false, next: false },
    });
  });

  it("shoud work with pagination", () => {
    searchStub.reset();
    searchStub.returns(servicesMockMultiplePages);
    searchServicesGet(getRequestMock() as Request, res as Response);
    expect(res.render).to.have.calledWith("search-services/index.njk", {
      env: "test",
      services: [
        "service1",
        "service10",
        "service11",
        "service12",
        "service13",
        "service14",
        "service15",
        "service16",
        "service17",
        "service18",
      ],
      hasSearch: false,
      resultsCount: 25,
      query: undefined,
      pagination: {
        items: [
          {
            number: 1,
            current: true,
            href: "/search-services?page=1",
          },
          {
            number: 2,
            current: false,
            href: "/search-services?page=2",
          },
          {
            number: 3,
            current: false,
            href: "/search-services?page=3",
          },
        ],
        previous: false,
        next: { href: "/search-services?page=2" },
      },
      englishLanguageLink: '/search-services?lng=en',
      isWelsh: false
    });
  });
});
