import { expect } from "chai";
import { describe, it, beforeEach, afterEach } from "mocha";
import sinon from "sinon";
import {
  getAllServices,
  searchServices,
  searchServicesGet,
  createSearchIndex,
} from "../search-services-controller";
import * as controller from "../search-services-controller";
import { LOCALE } from "../../../app.constants";
import * as config from "../../../config";
import * as registry from "di-account-management-rp-registry";
import i18next from "i18next";
import * as safeTranslateModule from "../../../utils/safeTranslate";

describe("getAllServices", () => {
  let sandbox: sinon.SinonSandbox;
  let mockTranslate: sinon.SinonStub;
  let getClientsToShowInSearchStub: sinon.SinonStub;
  let getAppEnvStub: sinon.SinonStub;
  let getTranslationsStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockTranslate = sandbox.stub();
    getClientsToShowInSearchStub = sandbox.stub(
      config,
      "getClientsToShowInSearch"
    );
    getAppEnvStub = sandbox.stub(config, "getAppEnv");
    getTranslationsStub = sandbox.stub(registry, "getTranslations");
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should return services with translated text for English locale", () => {
    getAppEnvStub.returns("dev");
    getClientsToShowInSearchStub.returns(["dbs", "client2"]);
    getTranslationsStub.returns({
      dbs: {
        additionalSearchTerms: "terms1",
      },
      client2: {},
    });

    mockTranslate
      .withArgs("clientRegistry.dev.dbs.startText")
      .returns("Service 1");
    mockTranslate
      .withArgs("clientRegistry.dev.dbs.startUrl")
      .returns("https://service1.gov.uk");
    mockTranslate
      .withArgs("clientRegistry.dev.dbs.additionalSearchTerms")
      .returns("terms1");
    mockTranslate
      .withArgs("clientRegistry.dev.client2.startText")
      .returns("Service 2");
    mockTranslate
      .withArgs("clientRegistry.dev.client2.startUrl")
      .returns("https://service2.gov.uk");

    const result = getAllServices(mockTranslate, LOCALE.EN);

    expect(result).to.have.length(2);
    expect(result[0]).to.deep.equal({
      clientId: "dbs",
      startText: "Service 1",
      startUrl: "https://service1.gov.uk",
      additionalSearchTerms: "terms1",
    });
    expect(result[1]).to.deep.equal({
      clientId: "client2",
      startText: "Service 2",
      startUrl: "https://service2.gov.uk",
      additionalSearchTerms: "",
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
      clientId: "client1",
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
    expect(result[0]?.startText).to.equal("Alpha Service");
    expect(result[1].startText).to.equal("Beta Service");
    expect(result[2].startText).to.equal("Zebra Service");
  });

  it("should work with Welsh locale", () => {
    getAppEnvStub.returns("dev");
    getClientsToShowInSearchStub.returns(["dbs"]);
    getTranslationsStub.returns({
      dbs: {
        additionalSearchTerms: "termau1",
      },
      client2: {},
    });

    mockTranslate
      .withArgs("clientRegistry.dev.dbs.startText")
      .returns("Gwasanaeth 1");
    mockTranslate
      .withArgs("clientRegistry.dev.dbs.startUrl")
      .returns("https://gwasanaeth1.gov.uk");
    mockTranslate
      .withArgs("clientRegistry.dev.dbs.additionalSearchTerms")
      .returns("termau1");

    const result = getAllServices(mockTranslate, LOCALE.CY);

    expect(result).to.have.length(1);
    expect(result[0]).to.deep.equal({
      clientId: "dbs",
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

describe("createSearchIndex", () => {
  let sandbox: sinon.SinonSandbox;
  let i18nextStub: sinon.SinonStub;
  let safeTranslateStub: sinon.SinonStub;
  let getAllServicesStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    i18nextStub = sandbox.stub(i18next, "getFixedT");
    safeTranslateStub = sandbox.stub(safeTranslateModule, "safeTranslate");
    getAllServicesStub = sandbox.stub(controller, "getAllServices");
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should create index when createIfDoesntExist is true and index doesn't exist", async () => {
    const mockTranslate = sandbox.stub();
    i18nextStub.returns(mockTranslate);
    safeTranslateStub.returns("translated");
    getAllServicesStub.returns([
      {
        clientId: "client1",
        startText: "Service 1",
        additionalSearchTerms: "terms",
      },
    ]);

    await createSearchIndex(LOCALE.EN, true, false);

    expect(i18nextStub).to.have.been.calledWith(LOCALE.EN);
    expect(getAllServicesStub).to.have.been.called;
  });

  it("should not create index when createIfDoesntExist is false and index doesn't exist", async () => {
    await createSearchIndex(LOCALE.EN, false, false);

    expect(i18nextStub).not.to.have.been.called;
    expect(getAllServicesStub).not.to.have.been.called;
  });
});

describe("searchServices", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    const i18nextStub = sandbox.stub(i18next, "getFixedT");
    const safeTranslateStub = sandbox.stub(
      safeTranslateModule,
      "safeTranslate"
    );
    const getAllServicesStub = sandbox.stub(controller, "getAllServices");

    const mockTranslate = sandbox.stub();
    i18nextStub.returns(
      mockTranslate as unknown as ReturnType<typeof i18nextStub>
    );
    safeTranslateStub.returns("translated");
    getAllServicesStub.returns([
      {
        clientId: "client1",
        startText: "Tax Service",
        startUrl: "https://tax.gov.uk",
        additionalSearchTerms: "HMRC revenue",
      },
      {
        clientId: "client2",
        startText: "Passport Service",
        startUrl: "https://passport.gov.uk",
        additionalSearchTerms: "travel documents",
      },
      {
        clientId: "client3",
        startText: "Benefits Service",
        startUrl: "https://benefits.gov.uk",
        additionalSearchTerms: "",
      },
    ]);

    await createSearchIndex(LOCALE.EN, true, true);
  });

  afterEach(() => {
    sandbox.restore();
  });

  const mockServices = [
    {
      clientId: "client1",
      startText: "Tax Service",
      startUrl: "https://tax.gov.uk",
      additionalSearchTerms: "HMRC revenue",
    },
    {
      clientId: "client2",
      startText: "Passport Service",
      startUrl: "https://passport.gov.uk",
      additionalSearchTerms: "travel documents",
    },
    {
      clientId: "client3",
      startText: "Benefits Service",
      startUrl: "https://benefits.gov.uk",
      additionalSearchTerms: "",
    },
  ];

  it("should return matching services based on startText", async () => {
    const result = await searchServices(LOCALE.EN, "tax", mockServices);

    expect(result).to.have.length(1);
    expect(result[0]?.clientId).to.equal("client1");
  });

  it("should return matching services based on additionalSearchTerms", async () => {
    const result = await searchServices(LOCALE.EN, "HMRC", mockServices);

    expect(result).to.have.length(1);
    expect(result[0]?.clientId).to.equal("client1");
  });

  it("should return multiple matching services", async () => {
    const result = await searchServices(LOCALE.EN, "service", mockServices);

    expect(result).to.have.length(3);
  });

  it("should return empty array when no matches found", async () => {
    const result = await searchServices(LOCALE.EN, "nonexistent", mockServices);

    expect(result).to.have.length(0);
  });

  it("should handle empty query", async () => {
    const result = await searchServices(LOCALE.EN, "", mockServices);

    expect(result).to.have.length(0);
  });

  it("should handle empty services array", async () => {
    const result = await searchServices(LOCALE.EN, "tax", []);

    expect(result).to.have.length(0);
  });

  it("should be case insensitive", async () => {
    const result = await searchServices(LOCALE.EN, "TAX", mockServices);

    expect(result).to.have.length(1);
    expect(result[0]?.clientId).to.equal("client1");
  });

  it("should handle partial matches", async () => {
    const result = await searchServices(LOCALE.EN, "pass", mockServices);

    expect(result).to.have.length(1);
    expect(result[0]?.clientId).to.equal("client2");
  });
});

describe("searchServicesGet", () => {
  let sandbox: sinon.SinonSandbox;
  let mockReq: any;
  let mockRes: any;
  let getAllServicesStub: sinon.SinonStub;
  let searchServicesStub: sinon.SinonStub;
  let createSearchIndexStub: sinon.SinonStub;
  let getAppEnvStub: sinon.SinonStub;

  const mockServices = [
    {
      clientId: "client1",
      startText: "Service 1",
      startUrl: "",
      additionalSearchTerms: "",
    },
    {
      clientId: "client2",
      startText: "Service 2",
      startUrl: "",
      additionalSearchTerms: "",
    },
  ];

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    getAllServicesStub = sandbox.stub(controller, "getAllServices");
    searchServicesStub = sandbox.stub(controller, "searchServices");
    createSearchIndexStub = sandbox.stub(controller, "createSearchIndex");
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

  it("should render all services when no query provided", async () => {
    await searchServicesGet(mockReq, mockRes);

    expect(getAllServicesStub).to.have.been.calledWith(mockReq.t, LOCALE.EN);
    expect(createSearchIndexStub).to.have.been.calledWith(
      LOCALE.EN,
      true,
      false
    );
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

  it("should search services when query provided", async () => {
    const filteredServices = [mockServices[0]];
    mockReq.query.q = "service";
    searchServicesStub.returns(filteredServices);

    await searchServicesGet(mockReq, mockRes);

    expect(getAllServicesStub).to.have.been.calledWith(mockReq.t, LOCALE.EN);
    expect(createSearchIndexStub).to.have.been.calledWith(
      LOCALE.EN,
      true,
      false
    );
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

  it("should handle Welsh locale", async () => {
    mockReq.language = LOCALE.CY;

    await searchServicesGet(mockReq, mockRes);

    expect(getAllServicesStub).to.have.been.calledWith(mockReq.t, LOCALE.CY);
    expect(createSearchIndexStub).to.have.been.calledWith(
      LOCALE.CY,
      true,
      false
    );
    expect(mockRes.render).to.have.been.calledWith(
      "search-services/index.njk",
      sinon.match({
        isWelsh: true,
      })
    );
  });

  it("should default to English when no language set", async () => {
    mockReq.language = undefined;

    await searchServicesGet(mockReq, mockRes);

    expect(getAllServicesStub).to.have.been.calledWith(mockReq.t, LOCALE.EN);
    expect(mockRes.render).to.have.been.calledWith(
      "search-services/index.njk",
      sinon.match({
        isWelsh: false,
      })
    );
  });

  it("should add metrics", async () => {
    await searchServicesGet(mockReq, mockRes);

    expect(mockReq.metrics.addMetric).to.have.been.calledWith(
      "searchServicesGet",
      "Count",
      1
    );
  });

  it("should handle missing metrics gracefully", () => {
    mockReq.metrics = undefined;

    expect(() => searchServicesGet(mockReq, mockRes)).not.to.throw();
  });

  it("should preserve existing query params except q in English link", async () => {
    mockReq.originalUrl = "/search?param=value&q=test";

    await searchServicesGet(mockReq, mockRes);

    expect(mockRes.render).to.have.been.calledWith(
      "search-services/index.njk",
      sinon.match({
        englishLanguageLink: "/search?param=value&lng=en",
      })
    );
  });
});
