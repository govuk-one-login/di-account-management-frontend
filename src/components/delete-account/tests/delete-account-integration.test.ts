import request from "supertest";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import nock = require("nock");
import * as cheerio from "cheerio";
import decache from "decache";
import { API_ENDPOINTS, PATH_DATA } from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { getBaseUrl } from "../../../config";

describe("Integration:: delete account", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
  let cookies: string;
  let app: any;
  let baseApi: string;
  let govUkPublishingBaseApi: string;
  const idToken = "Idtoken";
  const TEST_SUBJECT_ID = "sub";

  before(async () => {
    decache("../../../app");
    decache("../../../middleware/requires-auth-middleware");
    const sessionMiddleware = require("../../../middleware/requires-auth-middleware");
    sandbox = sinon.createSandbox();
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

    sandbox.stub(oidc, "getJWKS").callsFake(() => {
      return new Promise((resolve) => {
        resolve({});
      });
    });

    app = await require("../../../app").createApp();

    baseApi = process.env.AM_API_BASE_URL;
    govUkPublishingBaseApi = process.env.GOV_ACCOUNTS_PUBLISHING_API_URL;

    request(app)
      .get(PATH_DATA.DELETE_ACCOUNT.url)
      .end((err, res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"];
      });
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  after(() => {
    sandbox.restore();
    app = undefined;
  });

  it("should return delete account page", (done) => {
    request(app).get(PATH_DATA.DELETE_ACCOUNT.url).expect(200, done);
  });

  it("should return error when csrf not present", (done) => {
    request(app)
      .post(PATH_DATA.DELETE_ACCOUNT.url)
      .type("form")
      .expect(500, done);
  });

  it("should redirect to end session endpoint", (done) => {
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
          `${baseUrl}${PATH_DATA.ACCOUNT_DELETED_CONFIRMATION.url}`
        )}`
      )
      .expect(302, done);
  });
});
