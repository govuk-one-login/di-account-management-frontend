import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import { PATH_DATA } from "../../../app.constants";
import {
  checkYourEmailGet,
  checkYourEmailPost,
} from "../check-your-email-controller";
import { CheckYourEmailServiceInterface } from "../types";
import { GovUkPublishingServiceInterface } from "../../common/gov-uk-publishing/types";

describe("check your email controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: { user: { state: { changeEmail: {} } } },
      cookies: { lng: "en" },
      i18n: { language: "en" },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      log: { info: sandbox.fake() }
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

  describe("checkYourEmailGet", () => {
    it("should render check your phone view", () => {
      checkYourEmailGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("check-your-email/index.njk");
    });
  });

  describe("checkYourEmailPost", () => {
    it("should redirect to /email-updated-confirmation when valid code entered", async () => {
      const fakeService: CheckYourEmailServiceInterface = {
        updateEmail: sandbox.fake.returns(true),
      };

      const fakePublishingService: GovUkPublishingServiceInterface = {
        notifyAccountDeleted: sandbox.fake(),
        notifyEmailChanged: sandbox.fake.returns(Promise.resolve()),
      };

      req.session.user.tokens = { accessToken: "token" };
      req.body.code = "123456";

      await checkYourEmailPost(fakeService, fakePublishingService)(
        req as Request,
        res as Response
      );

      expect(fakeService.updateEmail).to.have.been.calledOnce;
      expect(fakePublishingService.notifyEmailChanged).to.have.been.calledOnce;
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.EMAIL_UPDATED_CONFIRMATION.url
      );
    });

    it("should return error when invalid code entered", async () => {
      const fakeService: CheckYourEmailServiceInterface = {
        updateEmail: sandbox.fake.returns(false),
      };

      req.session.user.tokens = { accessToken: "token" };
      req.t = sandbox.fake.returns("translated string");
      req.body.code = "678988";
      res.locals.sessionId = "123456-djjad";

      await checkYourEmailPost(fakeService)(req as Request, res as Response);

      expect(fakeService.updateEmail).to.have.been.calledOnce;
      expect(res.render).to.have.been.calledWith("check-your-email/index.njk");
    });
  });
});
