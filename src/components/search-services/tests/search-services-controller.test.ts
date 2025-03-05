import { expect } from "chai";
import { describe } from "mocha";
import { searchServicesGet } from "../search-services-controller";
import { Request, Response } from "express";
import { sinon } from "../../../../test/utils/test-utils";

import * as config from "../../../config";
import * as isUserLoggedIn from "../../../utils/isUserLoggedIn";

const translations: Record<string, string> = {
  "clientRegistry.test.govuk.header": "gov.uk email",
  "clientRegistry.test.lite.header": "LITE (licenseing)",
  "clientRegistry.test.ofqual.header": "Ofqual subject matter",
  "clientRegistry.test.slavery.header": "Modern slavery statement registry",
  "clientRegistry.test.apprentice.header": "Manage apprenticeships",
};

const servicesMock = ["govuk", "lite", "ofqual", "slavery", "apprentice"];
const servicesMockSorted = ["govuk", "lite", "apprentice", "slavery", "ofqual"];

const getRequestMock = (q?: string): Partial<Request> => {
  return {
    query: q ? { q } : {},
    t: (k: string): string => translations[k],
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
    sandbox.stub(isUserLoggedIn, "default").returns(false);
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
      showSignOut: false,
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
      showSignOut: false,
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
      showSignOut: false,
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
      showSignOut: false,
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
      showSignOut: false,
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
      showSignOut: false,
    });
  });
});
