import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import { ChangePhoneNumberServiceInterface } from "../types";
import { ERROR_CODES, PATH_DATA } from "../../../app.constants";
import {
  changePhoneNumberGet,
  changePhoneNumberPost,
} from "../change-phone-number-controller";

describe("change phone number controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: { user: { state: { changePhoneNumber: {} } } },
      i18n: { language: "" },
      t: sandbox.fake(),
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(),
      locals: {},
      status: sandbox.fake(),
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("changePhoneNumberGet", () => {
    it("should render change phone number page", () => {
      changePhoneNumberGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("change-phone-number/index.njk");
    });
  });

  describe("changePhoneNumberPost", () => {
    it("should redirect to /phone-number-updated-confirmation page", async () => {
      const fakeService: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: sandbox.fake.returns({
          success: true,
        }),
      };

      req.session.user.tokens = { accessToken: "token" };
      req.body.phoneNumber = "12345678991";

      await changePhoneNumberPost(fakeService)(req as Request, res as Response);

      expect(fakeService.sendPhoneVerificationNotification).to.have.been
        .calledOnce;
      expect(res.redirect).to.have.calledWith(PATH_DATA.CHECK_YOUR_PHONE.url);
    });

    it("should return validation error when same number", async () => {
      const fakeService: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: sandbox.fake.returns({
          success: false,
          code: ERROR_CODES.NEW_PHONE_NUMBER_SAME_AS_EXISTING,
        }),
      };

      req.session.user.tokens = { accessToken: "token" };
      req.body.phoneNumber = "12345678991";

      await changePhoneNumberPost(fakeService)(req as Request, res as Response);

      expect(fakeService.sendPhoneVerificationNotification).to.have.been.called;
      expect(res.render).to.have.calledWith("change-phone-number/index.njk");
    });
    it("should redirect to /phone-number-updated-confirmation when success with valid international number", async () => {
      const fakeService: ChangePhoneNumberServiceInterface = {
        sendPhoneVerificationNotification: sandbox.fake.returns({
          success: true,
        }),
      };

      res.locals.sessionId = "123456-djjad";
      req.session.user.tokens = { accessToken: "token" };
      req.body.phoneNumber = "+33645453322";
      req.session.user.email = "test@test.com";

      await changePhoneNumberPost(fakeService)(req as Request, res as Response);

      expect(fakeService.sendPhoneVerificationNotification).to.have.been
        .calledOnce;
      expect(res.redirect).to.have.calledWith(PATH_DATA.CHECK_YOUR_PHONE.url);
    });
  });
});
