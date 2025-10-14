import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import { PATH_DATA } from "../../../app.constants";
import {
  checkYourEmailGet,
  checkYourEmailPost,
} from "../check-your-email-controller";
import {
  CheckYourEmailServiceError,
  CheckYourEmailServiceInterface,
} from "../types";
import { GovUkPublishingServiceInterface } from "../../common/gov-uk-publishing/types";
import * as oidcModule from "../../../utils/oidc";

describe("check your email controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: {
        user: { state: { changeEmail: { value: "CHANGE_VALUE" } } },
      } as any,
      cookies: { lng: "en" },
      i18n: { language: "en" },
      log: { error: sandbox.fake() },
      headers: { "txma-audit-encoded": "encoded" },
    } as any;
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      status: sandbox.fake(),
      locals: {},
    };
    sandbox.replace(oidcModule, "refreshToken", async () => {});
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
        updateEmail: sandbox.fake.resolves({ success: true }),
      };

      const fakePublishingService: GovUkPublishingServiceInterface = {
        notifyAccountDeleted: sandbox.fake(),
        notifyEmailChanged: sandbox.fake.returns(Promise.resolve()),
      };

      req.session.user.tokens = { accessToken: "token" } as any;
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
        updateEmail: sandbox.fake.resolves({
          success: false,
          error: undefined,
        }),
      };

      req.session.user.tokens = { accessToken: "token" } as any;
      req.t = sandbox.fake.returns("translated string");
      req.body.code = "678988";
      res.locals.sessionId = "123456-djjad";

      await checkYourEmailPost(fakeService)(req as Request, res as Response);

      expect(fakeService.updateEmail).to.have.been.calledOnce;
      expect(res.render).to.have.been.calledWith("check-your-email/index.njk");
    });

    it("should redirect email address is denied", async () => {
      const fakeService: CheckYourEmailServiceInterface = {
        updateEmail: sandbox.fake.resolves({
          success: false,
          error: CheckYourEmailServiceError.EMAIL_ADDRESS_DENIED,
        }),
      };

      req.session.user.tokens = { accessToken: "token" } as any;
      req.t = sandbox.fake.returns("translated string");
      req.body.code = "678988";
      res.locals.sessionId = "123456-djjad";

      await checkYourEmailPost(fakeService)(req as Request, res as Response);

      expect(fakeService.updateEmail).to.have.been.calledOnce;
      expect(res.redirect).to.have.calledWith(
        `${PATH_DATA.CHANGE_EMAIL.url}?email_cant_be_used=1`
      );
    });
  });
});
