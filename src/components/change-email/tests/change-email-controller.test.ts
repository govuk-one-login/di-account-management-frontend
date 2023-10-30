import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import { changeEmailGet, changeEmailPost } from "../change-email-controller";
import { ChangeEmailServiceInterface } from "../types";
import { getInitialState } from "../../../utils/state-machine";
import { HTTP_STATUS_CODES } from "../../../app.constants";

describe("change email controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: { user: {} } as any,
      cookies: { lng: "en" },
      i18n: { language: "en" },
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

  describe("changeEmailGet", () => {
    it("should render enter new email", () => {
      changeEmailGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("change-email/index.njk");
    });
  });

  describe("changeEmailPost", () => {
    it("should redirect to /check-your-email on submit", async () => {
      const fakeService: ChangeEmailServiceInterface = {
        sendCodeVerificationNotification: sandbox.fake.returns(true),
      };

      req.body.email = "test@test.com";
      req.session.user = {
        tokens: { accessToken: "token" } as any,
        email: "test@dl.com",
        state: { changeEmail: getInitialState() },
      } as any;
      req.cookies.lng = "en";

      await changeEmailPost(fakeService)(req as Request, res as Response);

      expect(fakeService.sendCodeVerificationNotification).to.have.been
        .calledOnce;
      expect(res.redirect).to.have.calledWith("/check-your-email");
    });

    it("should render bad request", async () => {
      const fakeService: ChangeEmailServiceInterface = {
        sendCodeVerificationNotification: sandbox.fake.returns(true),
      };

      req.body.email = "test@test.com";
      req.session.user = {
        tokens: { accessToken: "token" },
        email: "test@test.com",
        state: { changeEmail: getInitialState() },
      } as any;
      req.cookies.lng = "en";

      await changeEmailPost(fakeService)(req as Request, res as Response);
      expect(res.status).to.have.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });
  });
});
