import { expect } from "chai";
import { describe } from "mocha";
import { searchServicesGet } from "../search-services-controller";
import { Request, Response } from "express";
import { sinon } from "../../../../test/utils/test-utils";

import * as config from "../../../config";

const translations: Record<string, string> = {
  "clientRegistry.test.govuk.startText": "gov.uk email",
  "clientRegistry.test.lite.startText": "LITE (licenseing)",
  "clientRegistry.test.ofqual.startText": "Ofqual subject matter",
  "clientRegistry.test.slavery.startText": "Modern slavery statement registry",
  "clientRegistry.test.apprentice.startText": "Manage apprenticeships",
};

const servicesMock = ["govuk", "lite", "ofqual", "slavery", "apprentice"];
const servicesMockSorted = ["govuk", "lite", "apprentice", "slavery", "ofqual"];

const getRequestMock = (q?: string, lng?: string): Partial<Request> => {
  const url = lng === "cy" ? "/search-services?lng=cy" : "/search-services";
  return {
    query: q ? { q } : {},
    t: (k: string): string => translations[k],
    originalUrl: url,
    language: lng || "en",
  };
};

describe("search services controller", () => {
  let res: Partial<Response>;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    res = {
      render: sandbox.fake(),
    };

    sandbox.stub(config, "getClientsToShowInSearch").returns(servicesMock);
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
    });
  });

  it("should match across words in the service startText", () => {
    searchServicesGet(getRequestMock("ageappre") as Request, res as Response);
    expect(res.render).to.have.calledWith("search-services/index.njk", {
      env: "test",
      services: ["apprentice"],
      query: "ageappre",
      hasSearch: true,
      resultsCount: 1,
      isWelsh: false,
      englishLanguageLink: "/search-services?lng=en",
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
    });
  });
});
