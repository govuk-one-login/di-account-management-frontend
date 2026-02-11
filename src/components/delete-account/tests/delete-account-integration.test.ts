import request from "supertest";
import {
  describe,
  beforeAll,
  afterAll,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import { testComponent } from "../../../../test/utils/helpers";
import nock = require("nock");
import * as cheerio from "cheerio";
import { API_ENDPOINTS, PATH_DATA } from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { getBaseUrl } from "../../../config.js";
import { Service } from "../../../utils/types";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";

describe("Integration:: delete account", () => {
  let token: string | string[];
  let cookies: string;
  let app: any;
  let baseApi: string;
  let govUkPublishingBaseApi: string;
  let yourServicesStub: ReturnType<typeof vi.fn>;
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

  const manyServices: Service[] = [
    {
      client_id: "hoSubmitAPleasureCraftReport",
      count_successful_logins: 1,
      last_accessed: 14567776,
      last_accessed_readable_format: "last_accessed_readable_format",
    },
    {
      client_id: "CMAD",
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
    yourServicesStub.mockImplementation(function (): Service[] {
      return serviceList;
    });
  }

  beforeAll(async () => {
    vi.resetModules();
    vi.resetModules();
    const sessionMiddleware = await import(
      "../../../middleware/requires-auth-middleware.js"
    );
    const yourServices = await import("../../../utils/yourServices.js");
    yourServicesStub = vi.spyOn(
      yourServices,
      "getYourServicesForAccountDeletion"
    );
    stubGetAllowedListServicesToReturn(aSingleService);
    vi.spyOn(sessionMiddleware, "requiresAuthMiddleware").mockImplementation(
      function (req: any, res: any, next: any): void {
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
      }
    );

    const oidc = await import("../../../utils/oidc.js");
    vi.spyOn(oidc, "getOIDCClient").mockImplementation(() => {
      return Promise.resolve({
        endSessionUrl: function (params: any = {}) {
          const stateParam = params.state ? `&state=${params.state}` : "";
          return `${process.env.API_BASE_URL}/logout?id_token_hint=${
            params.id_token_hint
          }&post_logout_redirect_uri=${encodeURIComponent(
            params.post_logout_redirect_uri
          )}${stateParam}`;
        },
      });
    });

    vi.spyOn(oidc, "getCachedJWKS").mockImplementation(() => {
      return Promise.resolve({});
    });

    app = await (await import("../../../app.js")).createApp();

    baseApi = process.env.AM_API_BASE_URL;
    govUkPublishingBaseApi = process.env.GOV_ACCOUNTS_PUBLISHING_API_URL;

    await request(app)
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
    yourServicesStub.mockClear();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    app = undefined;
  });

  it("should return delete account page", async () => {
    stubGetAllowedListServicesToReturn(aSingleService);
    const res = await request(app)
      .get(PATH_DATA.DELETE_ACCOUNT.url)
      .expect(200);
    expect(res.statusCode).toBe(200);
  });

  it("should display generic content if no services exist", async () => {
    stubGetAllowedListServicesToReturn([]);

    await request(app)
      .get(PATH_DATA.DELETE_ACCOUNT.url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("no-services-content")).text()).not.toBe("");
        expect($(testComponent("service-list-item")).text()).toBe("");
      })
      .expect(200);
  });

  it("should display a list of services if more than 1 service exists", async () => {
    stubGetAllowedListServicesToReturn(manyServices);

    await request(app)
      .get(PATH_DATA.DELETE_ACCOUNT.url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("service-list")).text()).not.toBe("");
        expect($(testComponent("service-list-item")).text()).not.toBe("");
        expect($(testComponent("service-paragraph")).text()).toBe("");
      })
      .expect(200);
  });

  it("should display a single paragraph when only 1 service exists", async () => {
    stubGetAllowedListServicesToReturn(aSingleService);

    await request(app)
      .get(PATH_DATA.DELETE_ACCOUNT.url)
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("service-list")).text()).toBe("");
        expect($(testComponent("service-list-item")).text()).toBe("");
        expect($(testComponent("service-paragraph")).text()).toContain(
          "Your GOV.UK app"
        );
      })
      .expect(200);
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

    const res = await request(app)
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
    expect(res.statusCode).toBe(302);
  });
});
