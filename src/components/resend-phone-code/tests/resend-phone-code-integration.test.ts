import request from "supertest";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import nock = require("nock");
import decache from "decache";
import {
  API_ENDPOINTS,
  CLIENT_SESSION_ID_UNKNOWN,
  PATH_DATA,
} from "../../../app.constants";
import { UnsecuredJWT } from "jose";
import { checkFailedCSRFValidationBehaviour } from "../../../../test/utils/behaviours";
import * as cheerio from "cheerio";
import { CURRENT_EMAIL } from "../../../../test/utils/builders";
import { expect } from "chai";
import { INTENT_CHANGE_PHONE_NUMBER } from "../../check-your-email/types";

const PHONE_NUMBER = "07839490040";

describe("Integration:: request phone code", () => {
  let token: string | string[];
  let cookies: string;
  let sandbox: sinon.SinonSandbox;
  let app: any;
  let baseApi: string;

  const TEST_SUBJECT_ID = "jkduasd";

  before(async () => {
    decache("../../../app");
    decache("../../../middleware/requires-auth-middleware");
    const sessionMiddleware = require("../../../middleware/requires-auth-middleware");
    sandbox = sinon.createSandbox();
    sandbox
      .stub(sessionMiddleware, "requiresAuthMiddleware")
      .callsFake(function (req: any, res: any, next: any): void {
        req.session.user = {
          email: CURRENT_EMAIL,
          phoneNumber: PHONE_NUMBER,
          subjectId: TEST_SUBJECT_ID,
          isAuthenticated: true,
          state: {
            changePhoneNumber: {
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
        resolve({});
      });
    });

    sandbox.stub(oidc, "getCachedJWKS").callsFake(() => {
      return new Promise((resolve) => {
        resolve({});
      });
    });

    app = await require("../../../app").createApp();
    baseApi = process.env.AM_API_BASE_URL;

    await request(app)
      .get(PATH_DATA.RESEND_PHONE_CODE.url)
      .then((res) => {
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

  it("should return resend phone code page", (done) => {
    request(app).get(PATH_DATA.RESEND_PHONE_CODE.url).expect(200, done);
  });

  it("should redirect to your services when csrf not present", async () => {
    await checkFailedCSRFValidationBehaviour(
      app,
      PATH_DATA.RESEND_PHONE_CODE.url,
      {
        phoneNumber: PHONE_NUMBER,
      }
    );
  });

  it("should resend the phone code", async () => {
    let phoneNumberRequestedToChangeTo: string;
    // Arrange
    nock(baseApi)
      .matchHeader("Client-Session-Id", CLIENT_SESSION_ID_UNKNOWN)
      .post(API_ENDPOINTS.SEND_NOTIFICATION, {
        email: CURRENT_EMAIL,
        phoneNumber: PHONE_NUMBER,
        notificationType: "VERIFY_PHONE_NUMBER",
      })
      .reply(
        204,
        (
          uri,
          requestBody: {
            email: string;
            phoneNumber: string;
            notificationType: "VERIFY_PHONE_NUMBER";
          }
        ) => {
          phoneNumberRequestedToChangeTo = requestBody.phoneNumber;
        }
      );

    // Act
    await request(app)
      .post(PATH_DATA.RESEND_PHONE_CODE.url)
      .type("form")
      .set("Cookie", cookies)
      .send({
        _csrf: token,
        phoneNumber: PHONE_NUMBER,
        intent: INTENT_CHANGE_PHONE_NUMBER,
      })
      .expect(302);

    expect(phoneNumberRequestedToChangeTo).to.equal(PHONE_NUMBER);
  });
});
