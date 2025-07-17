import request from "supertest";
import { describe } from "mocha";
import { expect, sinon } from "../../../../test/utils/test-utils";
import { testComponent } from "../../../../test/utils/helpers";
import * as cheerio from "cheerio";
import decache from "decache";
import { PATH_DATA } from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";
import { MfaClient } from "../../../utils/mfaClient";

describe("Integration:: check your phone", () => {
  let sandbox: sinon.SinonSandbox;
  let token: string | string[];
  let cookies: string;
  let app: any;

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
          publicSubjectId: "publicSubjectId",
          phoneNumber: "07839490040",
          newPhoneNumber: "07839490041",
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

        req.session.mfaMethods = [
          {
            mfaIdentifier: 111111,
            methodVerified: true,
            method: {
              phoneNumber: "070",
              mfaMethodType: "SMS",
            },
            priorityIdentifier: "DEFAULT",
          },
        ];
        next();
      });

    const oidc = require("../../../utils/oidc");
    sandbox.stub(oidc, "getOIDCClient").callsFake(() => {
      return Promise.resolve({});
    });

    sandbox.stub(oidc, "getCachedJWKS").callsFake(() => {
      return Promise.resolve({});
    });

    app = await require("../../../app").createApp();

    const configFuncs = require("../../../config");

    sandbox.stub(configFuncs, "getMfaServiceUrl").callsFake(() => {
      return "https://method-management-v1-stub.home.build.account.gov.uk";
    });

    const mfaClient = require("../../../utils/mfaClient");

    const stubMfaClient: sinon.SinonStubbedInstance<MfaClient> =
      sandbox.createStubInstance(mfaClient.MfaClient);

    stubMfaClient.retrieve.resolves({
      success: true,
      status: 200,
      data: [
        {
          mfaIdentifier: "123456",
          priorityIdentifier: "DEFAULT",
          method: {
            mfaMethodType: "AUTH_APP",
            credential: "abc123",
          },
          methodVerified: true,
        },
      ],
    });

    stubMfaClient.update.resolves({
      success: true,
      status: 200,
      data: [
        {
          mfaIdentifier: "123456",
          priorityIdentifier: "DEFAULT",
          method: {
            mfaMethodType: "AUTH_APP",
            credential: "abc123",
          },
          methodVerified: true,
        },
      ],
    });

    sandbox.stub(mfaClient, "createMfaClient").resolves(stubMfaClient);

    await request(app)
      .get(PATH_DATA.CHECK_YOUR_PHONE.url)
      .query({
        intent: "changePhoneNumber",
      })
      .then((res) => {
        const $ = cheerio.load(res.text);
        token = $("[name=_csrf]").val();
        cookies = res.headers["set-cookie"];
      });
  });

  after(() => {
    sandbox.restore();
    app = undefined;
  });

  it("should return check your phone page", async () => {
    const res = await request(app).get(PATH_DATA.CHECK_YOUR_PHONE.url).query({
      intent: "changePhoneNumber",
    });
    expect(res.statusCode).to.eq(200);
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
      .query({})
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "",
        intent: "changePhoneNumber",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("code-error")).text()).to.contains(
          "Enter the code"
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
        intent: "changePhoneNumber",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("code-error")).text()).to.contains(
          "Enter the code using only 6 digits"
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
        intent: "changePhoneNumber",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("code-error")).text()).to.contains(
          "Enter the code using only 6 digits"
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
        intent: "changePhoneNumber",
      })
      .expect(function (res) {
        const $ = cheerio.load(res.text);
        expect($(testComponent("code-error")).text()).to.contains(
          "Enter the code using only 6 digits"
        );
      })
      .expect(400);
  });

  it("should redirect to /update confirmation when valid code entered", async () => {
    await request(app)
      .post(PATH_DATA.CHECK_YOUR_PHONE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        code: "111111",
        intent: "changePhoneNumber",
      })
      .expect("Location", PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url)
      .expect(302);
  });
});
