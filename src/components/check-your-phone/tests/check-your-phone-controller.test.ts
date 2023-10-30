import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import {
  checkYourPhoneGet,
  checkYourPhonePost,
} from "../check-your-phone-controller";
import { CheckYourPhoneServiceInterface } from "../types";
import { PATH_DATA } from "../../../app.constants";

describe("check your phone controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: { user: { state: { changePhoneNumber: {} } } } as any,
      cookies: { lng: "en" },
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

      req.session.user.tokens = { accessToken: "token" } as any;
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

      req.session.user.tokens = { accessToken: "token" } as any;
      req.t = sandbox.fake.returns("translated string");
      req.body.code = "678988";
      res.locals.sessionId = "123456-djjad";

      await checkYourPhonePost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePhoneNumber).to.have.been.calledOnce;
      expect(res.render).to.have.been.calledWith("check-your-phone/index.njk");
    });
  });
});
