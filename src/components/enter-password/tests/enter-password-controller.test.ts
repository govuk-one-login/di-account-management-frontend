import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  enterPasswordGet,
  enterPasswordPost,
} from "../enter-password-controller";
import { EnterPasswordServiceInterface } from "../types";
import { PATH_NAMES } from "../../../app.constants";

describe("enter password controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = { body: {} };
    res = { render: sandbox.fake(), redirect: sandbox.fake(), locals: {} };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("enterEmailGet", () => {
    it("should render enter email view", () => {
      enterPasswordGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("enter-password/index.njk");
    });
  });

  describe("enterPasswordPost", () => {
    it("should redirect to enter-new-email when the password is correct", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        checkUserPassword: sandbox.fake.returns({
          isValidPassword: true,
          sessionState: "TODO_USER_STATE",
        }),
      };

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(PATH_NAMES.ENTER_NEW_EMAIL);
    });

    it("should throw error when API call throws error", async () => {
      const error = new Error("Internal server error");
      const fakeService: EnterPasswordServiceInterface = {
        checkUserPassword: sandbox.fake.throws(error),
      };

      await expect(
        enterPasswordPost(fakeService)(req as Request, res as Response)
      ).to.be.rejectedWith(Error, "Internal server error");
      expect(fakeService.checkUserPassword).to.have.been.calledOnce;
    });
  });
});
