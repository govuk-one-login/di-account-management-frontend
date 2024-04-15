import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  changePasswordGet,
  changePasswordPost,
} from "../change-password-controller";
import { ChangePasswordServiceInterface } from "../types";

import {
  ERROR_CODES,
  HTTP_STATUS_CODES,
  PATH_DATA,
} from "../../../app.constants";

describe("change password controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: { user: { state: { changePassword: {} } } } as any,
      cookies: { lng: "en" },
      i18n: { language: "en" },
      t: sandbox.fake(),
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      locals: {},
      status: sandbox.fake(),
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("changePasswordGet", () => {
    it("should render change password page", () => {
      changePasswordGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("change-password/index.njk");
    });
  });

  describe("changePasswordPost", () => {
    it("should redirect to /password-updated-confirmation page", async () => {
      const fakeService: ChangePasswordServiceInterface = {
        updatePassword: sandbox.fake.resolves({
          success: true,
          code: 200,
          message: "",
        }),
      };

      req.session.user.tokens = { accessToken: "token" } as any;
      req.body.password = "Password1";

      await changePasswordPost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePassword).to.have.been.calledOnce;
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.PASSWORD_UPDATED_CONFIRMATION.url
      );
    });
    it("should render bad request when password are same ", async () => {
      const fakeService: ChangePasswordServiceInterface = {
        updatePassword: sandbox.fake.resolves({
          success: false,
          code: ERROR_CODES.NEW_PASSWORD_SAME_AS_EXISTING,
          message: "",
        }),
      };
      req.session.user.tokens = { accessToken: "token" } as any;
      await changePasswordPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });

    it("should render bad request when password is common ", async () => {
      const fakeService: ChangePasswordServiceInterface = {
        updatePassword: sandbox.fake.resolves({
          success: false,
          code: ERROR_CODES.PASSWORD_IS_COMMON,
          message: "",
        }),
      };
      req.session.user.tokens = { accessToken: "token" } as any;
      await changePasswordPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });
  });
});
