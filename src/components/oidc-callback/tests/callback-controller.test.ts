import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { oidcAuthCallbackGet } from "../call-back-controller";
import { PATH_DATA } from "../../../app.constants";
import { ClientAssertionServiceInterface } from "../../../utils/types";

describe("callback controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: { user: {}, destroy: sandbox.fake() },
      t: sandbox.fake(),
      oidc: {
        callbackParams: sandbox.fake(),
        callback: sandbox.fake.returns({
          accessToken: "accessToken",
          idToken: "idToken",
        }),
        userinfo: sandbox.fake.returns({
          email: "ad@ad.com",
          phoneNumber: "12345678999",
        }),
        metadata: { redirect_uris: [] },
        issuer: {
          metadata: {},
        },
      },
    };
    res = { render: sandbox.fake(), redirect: sandbox.fake() };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("oidcAuthCallbackGet", () => {
    it("should redirect to /manage-your-account", async () => {
      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: sandbox.fake.returns("testassert"),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(
        PATH_DATA.MANAGE_YOUR_ACCOUNT.url
      );
    });
  });
});
