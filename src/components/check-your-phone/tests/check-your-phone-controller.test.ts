import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils.js";
import { Request, Response } from "express";
import {
  checkYourPhoneGet,
  checkYourPhonePost,
} from "../check-your-phone-controller";
import { CheckYourPhoneServiceInterface } from "../types.js";
import { PATH_DATA } from "../../../app.constants.js";
import { TXMA_AUDIT_ENCODED } from "../../../../test/utils/builders.js";

describe("check your phone controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    delete process.env.SUPPORT_CHANGE_MFA;
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: {
        user: { state: { changePhoneNumber: { value: "CHANGE_VALUE" } } },
        mfaMethods: [
          {
            mfaIdentifier: 111111,
            methodVerified: true,
            endPoint: "PHONE",
            mfaMethodType: "SMS",
            priorityIdentifier: "PRIMARY",
          },
        ],
      } as any,
      cookies: { lng: "en" },
      i18n: { language: "en" },
      headers: { "txma-audit-encoded": TXMA_AUDIT_ENCODED },
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      status: sandbox.fake(),
      locals: {},
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("checkYourPhoneGet", () => {
    it("should render check your phone view", () => {
      checkYourPhoneGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("check-your-phone/index.njk");
    });
  });

  describe("checkYourPhonePost", () => {
    it("should redirect to /phone-number-updated-confirmation when valid code entered", async () => {
      const fakeService: CheckYourPhoneServiceInterface = {
        updatePhoneNumber: sandbox.fake.resolves(true),
        updatePhoneNumberWithMfaApi: sandbox.fake.resolves(true),
      };

      req.session.user.tokens = { accessToken: "token" } as any;
      req.body.code = "123456";
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumber).to.have.been.calledOnce;
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url
      );
    });

    it("should return error when invalid code entered", async () => {
      const fakeService: CheckYourPhoneServiceInterface = {
        updatePhoneNumber: sandbox.fake.resolves(false),
        updatePhoneNumberWithMfaApi: sandbox.fake.resolves(false),
      };

      req.session.user.tokens = { accessToken: "token" } as any;
      req.t = sandbox.fake.returns("translated string");
      req.body.code = "678988";
      res.locals.sessionId = "123456-djjad";

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumber).to.have.been.calledOnce;
      expect(res.render).to.have.been.calledWith("check-your-phone/index.njk");
    });
  });

  describe("checkYourPhonePost with mfa method management API", () => {
    it("should redirect to /phone-number-updated-confirmation when valid code entered", async () => {
      process.env.SUPPORT_CHANGE_MFA = "1";
      const fakeService: CheckYourPhoneServiceInterface = {
        updatePhoneNumber: sandbox.fake.resolves(true),
        updatePhoneNumberWithMfaApi: sandbox.fake.resolves(true),
      };

      req.session.user.tokens = { accessToken: "token" } as any;
      req.session.user.state.changePhoneNumber.value = "CHANGE_VALUE";
      req.body.code = "123456";
      req.session.user.newPhoneNumber = "07111111111";
      req.session.user.email = "test@test.com";

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumberWithMfaApi).to.have.been.calledOnce;
      expect(fakeService.updatePhoneNumberWithMfaApi).to.have.calledWith({
        email: "test@test.com",
        otp: "123456",
        mfaMethod: {
          mfaIdentifier: 111111,
          methodVerified: true,
          endPoint: "07111111111",
          mfaMethodType: "SMS",
          priorityIdentifier: "PRIMARY",
        },
      });
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url
      );
      delete process.env.SUPPORT_CHANGE_MFA;
    });
  });
});
