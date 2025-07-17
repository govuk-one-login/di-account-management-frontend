import { expect } from "chai";
import { describe, it, beforeEach, afterEach } from "mocha";
import sinon from "sinon";
import {
  getAllServices,
  searchServices,
  searchServicesGet,
} from "../search-services-controller";
import * as controller from "../search-services-controller";
import { LOCALE } from "../../../app.constants";
import * as config from "../../../config";

describe("getAllServices", () => {
  let sandbox: sinon.SinonSandbox;
  let mockTranslate: sinon.SinonStub;
  let getClientsToShowInSearchStub: sinon.SinonStub;
  let getAppEnvStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockTranslate = sandbox.stub();
    getClientsToShowInSearchStub = sandbox.stub(
      config,
      "getClientsToShowInSearch"
    );
    getAppEnvStub = sandbox.stub(config, "getAppEnv");
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should return services with translated text for English locale", () => {
    getAppEnvStub.returns("dev");
    getClientsToShowInSearchStub.returns(["client1", "client2"]);

    mockTranslate
      .withArgs("clientRegistry.dev.client1.startText")
      .returns("Service 1");
    mockTranslate
      .withArgs("clientRegistry.dev.client1.startUrl")
      .returns("https://service1.gov.uk");
    mockTranslate
      .withArgs("clientRegistry.dev.client1.additionalSearchTerms")
      .returns("terms1");
    mockTranslate
      .withArgs("clientRegistry.dev.client2.startText")
      .returns("Service 2");
    mockTranslate
      .withArgs("clientRegistry.dev.client2.startUrl")
      .returns("https://service2.gov.uk");
    mockTranslate
      .withArgs("clientRegistry.dev.client2.additionalSearchTerms")
      .returns("terms2");

    const result = getAllServices(mockTranslate, LOCALE.EN);

    expect(result).to.have.length(2);
    expect(result[0]).to.deep.equal({
      client: "client1",
      startText: "Service 1",
      startUrl: "https://service1.gov.uk",
      additionalSearchTerms: "terms1",
    });
    expect(result[1]).to.deep.equal({
      client: "client2",
      startText: "Service 2",
      startUrl: "https://service2.gov.uk",
      additionalSearchTerms: "terms2",
    });
  });

  it("should return empty strings when translation keys are not found", () => {
    getAppEnvStub.returns("dev");
    getClientsToShowInSearchStub.returns(["client1"]);

    mockTranslate
      .withArgs("clientRegistry.dev.client1.startText")
      .returns("clientRegistry.dev.client1.startText");
    mockTranslate
      .withArgs("clientRegistry.dev.client1.startUrl")
      .returns("clientRegistry.dev.client1.startUrl");
    mockTranslate
      .withArgs("clientRegistry.dev.client1.additionalSearchTerms")
      .returns("clientRegistry.dev.client1.additionalSearchTerms");

    const result = getAllServices(mockTranslate, LOCALE.EN);

    expect(result).to.have.length(1);
    expect(result[0]).to.deep.equal({
      client: "client1",
      startText: "",
      startUrl: "",
      additionalSearchTerms: "",
    });
  });

  it("should sort services alphabetically by startText", () => {
    getAppEnvStub.returns("dev");
    getClientsToShowInSearchStub.returns(["client1", "client2", "client3"]);

    mockTranslate
      .withArgs("clientRegistry.dev.client1.startText")
      .returns("Zebra Service");
    mockTranslate.withArgs("clientRegistry.dev.client1.startUrl").returns("");
    mockTranslate
      .withArgs("clientRegistry.dev.client1.additionalSearchTerms")
      .returns("");
    mockTranslate
      .withArgs("clientRegistry.dev.client2.startText")
      .returns("Alpha Service");
    mockTranslate.withArgs("clientRegistry.dev.client2.startUrl").returns("");
    mockTranslate
      .withArgs("clientRegistry.dev.client2.additionalSearchTerms")
      .returns("");
    mockTranslate
      .withArgs("clientRegistry.dev.client3.startText")
      .returns("Beta Service");
    mockTranslate.withArgs("clientRegistry.dev.client3.startUrl").returns("");
    mockTranslate
      .withArgs("clientRegistry.dev.client3.additionalSearchTerms")
      .returns("");

    const result = getAllServices(mockTranslate, LOCALE.EN);

    expect(result).to.have.length(3);
    expect(result[0].startText).to.equal("Alpha Service");
    expect(result[1].startText).to.equal("Beta Service");
    expect(result[2].startText).to.equal("Zebra Service");
  });

  it("should work with Welsh locale", () => {
    getAppEnvStub.returns("dev");
    getClientsToShowInSearchStub.returns(["client1"]);

    mockTranslate
      .withArgs("clientRegistry.dev.client1.startText")
      .returns("Gwasanaeth 1");
    mockTranslate
      .withArgs("clientRegistry.dev.client1.startUrl")
      .returns("https://gwasanaeth1.gov.uk");
    mockTranslate
      .withArgs("clientRegistry.dev.client1.additionalSearchTerms")
      .returns("termau1");

    const result = getAllServices(mockTranslate, LOCALE.CY);

    expect(result).to.have.length(1);
    expect(result[0]).to.deep.equal({
      client: "client1",
      startText: "Gwasanaeth 1",
      startUrl: "https://gwasanaeth1.gov.uk",
      additionalSearchTerms: "termau1",
    });
    expect(getClientsToShowInSearchStub).to.have.been.calledWith(LOCALE.CY);
  });

  it("should handle empty client list", () => {
    getAppEnvStub.returns("dev");
    getClientsToShowInSearchStub.returns([]);

    const result = getAllServices(mockTranslate, LOCALE.EN);

    expect(result).to.have.length(0);
  });
});

describe("searchServices", () => {
  const mockServices = [
    {
      client: "client1",
      startText: "Tax Service",
      startUrl: "https://tax.gov.uk",
      additionalSearchTerms: "HMRC revenue",
    },
    {
      client: "client2",
      startText: "Passport Service",
      startUrl: "https://passport.gov.uk",
      additionalSearchTerms: "travel documents",
    },
    {
      client: "client3",
      startText: "Benefits Service",
      startUrl: "https://benefits.gov.uk",
      additionalSearchTerms: "",
    },
  ];

  it("should return matching services based on startText", () => {
    const result = searchServices(LOCALE.EN, "tax", mockServices);

    expect(result).to.have.length(1);
    expect(result[0].client).to.equal("client1");
  });

  it("should return matching services based on additionalSearchTerms", () => {
    const result = searchServices(LOCALE.EN, "HMRC", mockServices);

    expect(result).to.have.length(1);
    expect(result[0].client).to.equal("client1");
  });

  it("should return multiple matching services", () => {
    const result = searchServices(LOCALE.EN, "service", mockServices);

    expect(result).to.have.length(3);
  });

  it("should return empty array when no matches found", () => {
    const result = searchServices(LOCALE.EN, "nonexistent", mockServices);

    expect(result).to.have.length(0);
  });

  it("should handle empty query", () => {
    const result = searchServices(LOCALE.EN, "", mockServices);

    expect(result).to.have.length(0);
  });

  it("should handle empty services array", () => {
    const result = searchServices(LOCALE.CY, "tax", []);

    expect(result).to.have.length(0);
  });

  it("should be case insensitive", () => {
    const result = searchServices(LOCALE.EN, "TAX", mockServices);

    expect(result).to.have.length(1);
    expect(result[0]?.client).to.equal("client1");
  });

  it("should handle partial matches", () => {
    const result = searchServices(LOCALE.EN, "pass", mockServices);

    expect(result).to.have.length(1);
    expect(result[0]?.client).to.equal("client2");
  });
});

describe("searchServicesGet", () => {
  let sandbox: sinon.SinonSandbox;
  let mockReq: any;
  let mockRes: any;
  let getAllServicesStub: sinon.SinonStub;
  let searchServicesStub: sinon.SinonStub;
  let getAppEnvStub: sinon.SinonStub;

  const mockServices = [
    {
      client: "client1",
      startText: "Service 1",
      startUrl: "",
      additionalSearchTerms: "",
    },
    {
      client: "client2",
      startText: "Service 2",
      startUrl: "",
      additionalSearchTerms: "",
    },
  ];

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    getAllServicesStub = sandbox.stub(controller, "getAllServices");
    searchServicesStub = sandbox.stub(controller, "searchServices");
    getAppEnvStub = sandbox.stub(config, "getAppEnv");

    mockReq = {
      query: {},
      language: LOCALE.EN,
      originalUrl: "/search",
      t: sandbox.stub(),
      metrics: { addMetric: sandbox.stub() },
    };

    mockRes = {
      render: sandbox.stub(),
    };

    getAppEnvStub.returns("dev");
    getAllServicesStub.returns(mockServices);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should render all services when no query provided", () => {
    searchServicesGet(mockReq, mockRes);

    expect(getAllServicesStub).to.have.been.calledWith(mockReq.t, LOCALE.EN);
    expect(searchServicesStub).not.to.have.been.called;
    expect(mockRes.render).to.have.been.calledWith(
      "search-services/index.njk",
      {
        env: "dev",
        services: mockServices,
        query: "",
        hasSearch: false,
        resultsCount: 2,
        isWelsh: false,
        englishLanguageLink: "/search?lng=en",
      }
    );
  });

  it("should search services when query provided", () => {
    const filteredServices = [mockServices[0]];
    mockReq.query.q = "service";
    searchServicesStub.returns(filteredServices);

    searchServicesGet(mockReq, mockRes);

    expect(getAllServicesStub).to.have.been.calledWith(mockReq.t, LOCALE.EN);
    expect(searchServicesStub).to.have.been.calledWith(
      LOCALE.EN,
      "service",
      mockServices
    );
    expect(mockRes.render).to.have.been.calledWith(
      "search-services/index.njk",
      {
        env: "dev",
        services: filteredServices,
        query: "service",
        hasSearch: true,
        resultsCount: 1,
        isWelsh: false,
        englishLanguageLink: "/search?lng=en",
      }
    );
  });

  it("should handle Welsh locale", () => {
    mockReq.language = LOCALE.CY;

    searchServicesGet(mockReq, mockRes);

    expect(getAllServicesStub).to.have.been.calledWith(mockReq.t, LOCALE.CY);
    expect(mockRes.render).to.have.been.calledWith(
      "search-services/index.njk",
      sinon.match({
        isWelsh: true,
      })
    );
  });

  it("should default to English when no language set", () => {
    mockReq.language = undefined;

    searchServicesGet(mockReq, mockRes);

    expect(getAllServicesStub).to.have.been.calledWith(mockReq.t, LOCALE.EN);
    expect(mockRes.render).to.have.been.calledWith(
      "search-services/index.njk",
      sinon.match({
        isWelsh: false,
      })
    );
  });

  it("should add metrics", () => {
    searchServicesGet(mockReq, mockRes);

    expect(mockReq.metrics.addMetric).to.have.been.calledWith(
      "searchServicesGet",
      "Count",
      1
    );
  });

  it("should handle missing metrics gracefully", () => {
    mockReq.metrics = undefined;

    expect(() => searchServicesGet(mockReq, mockRes)).not.to.throw;
  });

  it("should preserve existing query params except q in English link", () => {
    mockReq.originalUrl = "/search?param=value&q=test";

    searchServicesGet(mockReq, mockRes);

    expect(mockRes.render).to.have.been.calledWith(
      "search-services/index.njk",
      sinon.match({
        englishLanguageLink: "/search?param=value&lng=en",
      })
    );
  });
});
