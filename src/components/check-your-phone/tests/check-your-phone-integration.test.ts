import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../../../../test/utils/test-utils";
import { testComponent } from "../../../../test/utils/helpers";
import nock = require("nock");
import * as cheerio from "cheerio";
import decache from "decache";
import { API_ENDPOINTS, PATH_DATA } from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";
import { CLIENT_SESSION_ID, SESSION_ID } from "../../../../test/utils/builders";

describe("Integration:: check your phone", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
  let cookies: string;
  let app: any;
  let baseApi: string;

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
          isAuthenticated: true,
          state: {
            changePhoneNumber: {
              value: "VERIFY_CODE",
              events: ["VALUE_UPDATED", "CONFIRMATION"],
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
        resolve({});
      });
    });

    sandbox.stub(oidc, "getJWKS").callsFake(() => {
      return new Promise((resolve) => {
        resolve({});
      });
    });

    app = await require("../../../app").createApp();
    baseApi = process.env.AM_API_BASE_URL;

    await request(app)
      .get(PATH_DATA.CHECK_YOUR_PHONE.url)
      .then((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"].concat(
          `gs=${SESSION_ID}.${CLIENT_SESSION_ID}`
        );
      });
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  after(() => {
    sandbox.restore();
    app = undefined;
  });

  it("should return check your phone page", (done) => {
    request(app).get(PATH_DATA.CHECK_YOUR_PHONE.url).expect(200, done);
  });

  it("should redirect to your services when csrf not present", async () => {
    await checkFailedCSRFValidationBehaviour(
      app,
      PATH_DATA.CHECK_YOUR_PHONE.url,
      {
        code: "123456",
      }
    );
  });

  it("should return validation error when code not entered", async () => {
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("code-error")).text()).to.contains(
          "Enter the security code"
        );
      })
      .expect(400);
  });

  it("should return validation error when code is less than 6 characters", async () => {
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "2",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("code-error")).text()).to.contains(
          "Enter the security code using only 6 digits"
        );
      })
      .expect(400);
  });

  it("should return validation error when code is greater than 6 characters", async () => {
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "1234567",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("code-error")).text()).to.contains(
          "Enter the security code using only 6 digits"
        );
      })
      .expect(400);
  });

  it("should return validation error when code entered contains letters", async () => {
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "12ert-",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("code-error")).text()).to.contains(
          "Enter the security code using only 6 digits"
        );
      })
      .expect(400);
  });

  it("should redirect to /create-password when valid code entered", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.UPDATE_PHONE_NUMBER)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID)
      .once()
      .reply(204);

    // Act
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "123456",
      })
      .expect("Location", PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url)
      .expect(302);
  });

  it("should return validation error when incorrect code entered", async () => {
    // Arrange
    nock(baseApi)
      .post(API_ENDPOINTS.UPDATE_PHONE_NUMBER)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID)
      .once()
      .reply(400, {});

    // Act
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "123455",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("code-error")).text()).to.contains(
          "The security code you entered is not correct, or may have expired, try entering it again or request a new security code."
        );
      })
      .expect(400);
  });
});
