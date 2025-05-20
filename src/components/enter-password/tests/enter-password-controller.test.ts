import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  enterPasswordGet,
  enterPasswordPost,
} from "../enter-password-controller";
import { EnterPasswordServiceInterface } from "../types";
import { HTTP_STATUS_CODES, PATH_DATA } from "../../../app.constants";
import { TXMA_AUDIT_ENCODED } from "../../../../test/utils/builders";
import * as logoutController from "../../../utils/logout";

describe("enter password controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: {
        user: {
          state: {
            changePassword: {},
            changePhoneNumber: {},
            changeEmail: {},
            deleteAccount: {},
          },
        },
      } as any,
      t: sandbox.fake(),
      i18n: { language: "" },
      query: {},
      headers: { "txma-audit-encoded": TXMA_AUDIT_ENCODED },
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      status: sandbox.fake(),
      locals: {},
    };
    process.env.ENABLE_CHANGE_ON_INTERVENTION = "1";
  });

  afterEach(() => {
    process.env.ENABLE_CHANGE_ON_INTERVENTION = "0";
    sandbox.restore();
  });

  describe("enterPasswordGet", () => {
    it("should render enter password view with query param", () => {
      req.query.type = "changePassword";

      enterPasswordGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("enter-password/index.njk");
    });

    it("should redirect to security when no with query param", () => {
      enterPasswordGet(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(PATH_DATA.SETTINGS.url);
    });
  });

  describe("enterPasswordPost", () => {
    it("should redirect to change-email when the password is correct", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake.resolves({ authenticated: true }),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        state: { changeEmail: { value: "CHANGE_VALUE" } },
        tokens: { accessToken: "token" },
      } as any;

      req.body["password"] = "password";
      req.body["requestType"] = "changeEmail";

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(PATH_DATA.CHANGE_EMAIL.url);
    });

    it("should bad request when user doesn't enter a password", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake(),
      };

      req.body["password"] = "";
      req.body["requestType"] = "changeEmail";

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(fakeService.authenticated).not.to.have.been.called;
      expect(res.render).to.have.been.called;
      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });

    it("should bad request when user credentials are incorrect", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake.resolves({ authenticated: false }),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        tokens: { accessToken: "token" },
      } as any;

      req.body["password"] = "password";
      req.body["requestType"] = "changeEmail";

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(res.render).to.have.been.called;
      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });

    it("should logout and redirect to permanently blocked when intervention is BLOCKED", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake.resolves({
          authenticated: false,
          intervention: "BLOCKED",
        }),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        tokens: { accessToken: "token" },
        state: { changeEmail: { value: "CHANGE_VALUE" } },
      } as any;

      req.body["password"] = "password";
      req.body["requestType"] = "changeEmail";

      const handleLogoutStub = sandbox.stub(logoutController, "handleLogout");

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(handleLogoutStub).to.have.been.calledWith(
        req,
        res,
        PATH_DATA.UNAVAILABLE_PERMANENT.url
      );
    });

    it("should logout and redirect to unavailable temporary when intervention is SUSPENDED", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake.resolves({
          authenticated: false,
          intervention: "SUSPENDED",
        }),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        tokens: { accessToken: "token" },
        state: { changeEmail: { value: "CHANGE_VALUE" } },
      } as any;

      req.body["password"] = "password";
      req.body["requestType"] = "changeEmail";

      const handleLogoutStub = sandbox.stub(logoutController, "handleLogout");

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(handleLogoutStub).to.have.been.calledWith(
        req,
        res,
        PATH_DATA.UNAVAILABLE_TEMPORARY.url
      );
    });
  });
});
