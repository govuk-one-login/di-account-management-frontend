import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../../../../test/utils/test-utils";
import { testComponent } from "../../../../test/utils/helpers";
import nock = require("nock");
import * as cheerio from "cheerio";
import decache from "decache";
import { API_ENDPOINTS, PATH_DATA } from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { getBaseUrl } from "../../../config";
import { Service } from "../../../utils/types";
import { SinonStub } from "sinon";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";

describe("Integration:: delete account", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
  let cookies: string;
  let app: any;
  let baseApi: string;
  let govUkPublishingBaseApi: string;
  let yourServicesStub: SinonStub<any[], any>;
  const idToken = "Idtoken";
  const TEST_SUBJECT_ID = "sub";

  const aSingleService: Service[] = [
    {
      client_id: "govukApp",
      count_successful_logins: 1,
      last_accessed: 14567776,
      last_accessed_readable_format: "last_accessed_readable_format",
    },
  ];

  const manyServicesIncludingGovUkPublishing: Service[] = [
    {
      client_id: "client_id",
      count_successful_logins: 1,
      last_accessed: 14567776,
      last_accessed_readable_format: "last_accessed_readable_format",
    },
    {
      client_id: "gov-uk",
      count_successful_logins: 2,
      last_accessed: 14567776,
      last_accessed_readable_format: "last_accessed_readable_format",
    },
  ];

  function stubGetAllowedListServicesToReturn(serviceList: Service[]) {
    yourServicesStub.callsFake(function (): Service[] {
      return serviceList;
    });
  }

  before(async () => {
    decache("../../../app");
    decache("../../../middleware/requires-auth-middleware");
    const sessionMiddleware = require("../../../middleware/requires-auth-middleware");
    const yourServices = require("../../../utils/yourServices");
    sandbox = sinon.createSandbox();
    yourServicesStub = sandbox.stub(yourServices, "getServices");
    sandbox
      .stub(sessionMiddleware, "requiresAuthMiddleware")
      .callsFake(function (req: any, res: any, next: any): void {
        req.session.user = {
          email: "test@test.com",
          phoneNumber: "07839490040",
          subjectId: TEST_SUBJECT_ID,
          isAuthenticated: true,
          state: {
            deleteAccount: {
              value: "CHANGE_VALUE",
              events: ["VALUE_UPDATED", "VERIFY_CODE_SENT"],
            },
          },
          tokens: {
            accessToken: new UnsecuredJWT({})
              .setIssuedAt()
              .setSubject("12345")
              .setIssuer("urn:example:issuer")
              .setAudience("urn:example:audience")
              .setExpirationTime("2h")
              .encode(),
            idToken: "Idtoken",
            refreshToken: "token",
          },
        };
        next();
      });

    const oidc = require("../../../utils/oidc");
    sandbox.stub(oidc, "getOIDCClient").callsFake(() => {
      return new Promise((resolve) => {
        resolve({
          endSessionUrl: function (params: any = {}) {
            return `${process.env.API_BASE_URL}/logout?id_token_hint=${
              params.id_token_hint
            }&post_logout_redirect_uri=${encodeURIComponent(
              params.post_logout_redirect_uri
            )}`;
          },
        });
      });
    });

    sandbox.stub(oidc, "getCachedJWKS").callsFake(() => {
      return new Promise((resolve) => {
        resolve({});
      });
    });

    app = await require("../../../app").createApp();

    baseApi = process.env.AM_API_BASE_URL;
    govUkPublishingBaseApi = process.env.GOV_ACCOUNTS_PUBLISHING_API_URL;

    request(app)
      .get(PATH_DATA.DELETE_ACCOUNT.url)
      .then((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"];
      });
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    yourServicesStub.reset();
  });

  after(() => {
    sandbox.restore();
    app = undefined;
  });

  it("should return delete account page", (done) => {
    stubGetAllowedListServicesToReturn(aSingleService);
    request(app).get(PATH_DATA.DELETE_ACCOUNT.url).expect(200, done);
  });

  it("should display generic content if no services exist", (done) => {
    stubGetAllowedListServicesToReturn([]);

    request(app)
      .get(PATH_DATA.DELETE_ACCOUNT.url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("no-services-content")).text()).to.not.be.empty;
        expect($(testComponent("govuk-email-subscription-info")).text()).to.be
          .empty;
        expect($(testComponent("service-list-item")).text()).to.be.empty;
      })
      .expect(200, done);
  });

  it("should display GovUk subscription info if publishing service exists", (done) => {
    stubGetAllowedListServicesToReturn(manyServicesIncludingGovUkPublishing);

    request(app)
      .get(PATH_DATA.DELETE_ACCOUNT.url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("govuk-email-subscription-info")).text()).to.not
          .be.empty;
        expect($(testComponent("service-list-item")).text()).to.not.be.empty;
      })
      .expect(200, done);
  });

  it("should not display subscription info if publishing service does not exists", (done) => {
    stubGetAllowedListServicesToReturn(aSingleService);

    request(app)
      .get(PATH_DATA.DELETE_ACCOUNT.url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("service-list-item")).text()).to.not.be.empty;
        expect($(testComponent("govuk-email-subscription-info")).text()).to.be
          .empty;
      })
      .expect(200, done);
  });

  it("post redirect to your services when csrf not present", async () => {
    await checkFailedCSRFValidationBehaviour(
      app,
      PATH_DATA.DELETE_ACCOUNT.url,
      null
    );
  });

  it("post should redirect to end session endpoint", async () => {
    nock(baseApi).post(API_ENDPOINTS.DELETE_ACCOUNT).once().reply(204);
    nock(govUkPublishingBaseApi)
      .delete(`${API_ENDPOINTS.ALPHA_GOV_ACCOUNT}${TEST_SUBJECT_ID}`)
      .once()
      .reply(204);

    const opApi = process.env.API_BASE_URL;
    const baseUrl = getBaseUrl();

    request(app)
      .post(PATH_DATA.DELETE_ACCOUNT.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
      })
      .expect(
        "Location",
        `${opApi}/logout?id_token_hint=${idToken}&post_logout_redirect_uri=${encodeURIComponent(
          `${baseUrl}${PATH_DATA.LOGOUT_REDIRECT.url}`
        )}&state=accountDeletion`
      )
      .expect(302);
  });
});
