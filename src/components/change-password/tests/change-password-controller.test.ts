import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  changePasswordGet,
  changePasswordPost,
} from "../change-password-controller";
import { ChangePasswordServiceInterface } from "../types";
import { PATH_DATA } from "../../../app.constants";

describe("change password controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = { body: {}, session: { user: { state: { changePassword: {} } } } };
    res = { render: sandbox.fake(), redirect: sandbox.fake(), locals: {} };
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
        updatePassword: sandbox.fake(),
      };

      req.session.user.tokens = { accessToken: "token" };
      req.body.password = "Password1";

      await changePasswordPost(fakeService)(req as Request, res as Response);

      expect(fakeService.updatePassword).to.have.been.calledOnce;
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.PASSWORD_UPDATED_CONFIRMATION.url
      );
    });
  });
});
