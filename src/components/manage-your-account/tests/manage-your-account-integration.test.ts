import request from "supertest";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import nock = require("nock");
import decache from "decache";

describe("Integration:: manage your account", () => {
  let sandbox: sinon.SinonSandbox;
  let app: any;
  before(() => {
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
          state: {},
          accessToken: "token",
        };
        next();
      });

    app = require("../../../app").createApp();
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  after(() => {
    sandbox.restore();
    app = undefined;
  });

  it("should return manage your account page", (done) => {
    request(app).get("/manage-your-account").expect(200, done);
  });
});
