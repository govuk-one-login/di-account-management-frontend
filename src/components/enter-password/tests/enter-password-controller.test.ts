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
      },
      t: sandbox.fake(),
      i18n: { language: "" },
      query: {},
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

  describe("enterPasswordGet", () => {
    it("should render enter password view with query param", () => {
      req.query.type = "changePassword";

      enterPasswordGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("enter-password/index.njk");
    });

    it("should redirect to manage your account when no with query param", () => {
      enterPasswordGet(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(
        PATH_DATA.MANAGE_YOUR_ACCOUNT.url
      );
    });
  });

  describe("enterPasswordPost", () => {
    it("should redirect to change-email when the password is correct", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake.returns({
          success: true,
        }),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        state: { changeEmail: {} },
        tokens: { accessToken: "token" },
      };

      req.body["password"] = "password";
      req.body["requestType"] = "changeEmail";

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(PATH_DATA.CHANGE_EMAIL.url);
    });

    it("should bad request when user credentials are incorrect", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake.returns(false),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        tokens: { accessToken: "token" },
      };

      req.body["password"] = "password";
      req.body["requestType"] = "changeEmail";

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(res.render).to.have.been.called;
      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });
  });
});
