import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import {
  checkYourPhoneGet,
  checkYourPhonePost,
} from "../check-your-phone-controller";
import { CheckYourPhoneServiceInterface } from "../types";
import { ERROR_CODES, PATH_DATA } from "../../../app.constants";

describe("check your phone controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: { user: { state: { changePhoneNumber: {} } } },
      i18n: { language: "en" },
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(),
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
        updatePhoneNumber: sandbox.fake.returns(true),
      };

      req.session.user.tokens = { accessToken: "token" };
      req.body.code = "123456";

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumber).to.have.been.calledOnce;
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url
      );
    });

    it("should return error when invalid code entered", async () => {
      const fakeService: CheckYourPhoneServiceInterface = {
        updatePhoneNumber: sandbox.fake.returns(false),
      };

      req.session.user.tokens = { accessToken: "token" };
      req.t = sandbox.fake.returns("translated string");
      req.body.code = "678988";
      res.locals.sessionId = "123456-djjad";

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumber).to.have.been.calledOnce;
      expect(res.render).to.have.been.calledWith("check-your-phone/index.njk");
    });

    it("should redirect to security code invalid when invalid code entered more too many retries", async () => {

      const fakeService: CheckYourPhoneServiceInterface = {
        updatePhoneNumber: sinon.fake.returns({
          data: {
            code: ERROR_CODES.INVALID_MFA_CODE_TOO_MANY_TIMES,
            message: "",
          },
          success: false,
        }),
      };

      req.t = sinon.fake.returns("translated string");
      req.body.code = "678988";
      res.locals.sessionId = "123456-djjad";

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumber).to.have.been.calledOnce;
      expect(res.redirect).to.have.been.calledWith(
        `${PATH_DATA.SECURITY_CODE_INVALID}?actionType=otpMaxRetries`
      );
    });
  });
});
