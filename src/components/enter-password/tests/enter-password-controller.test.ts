import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  enterPasswordGet,
  enterPasswordPost,
} from "../enter-password-controller";
import { EnterPasswordServiceInterface } from "../types";
import { HTTP_STATUS_CODES, PATH_NAMES } from "../../../app.constants";

describe("enter password controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: { user: {} },
      t: sandbox.fake(),
      i18n: { language: "" },
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

  describe("enterEmailGet", () => {
    it("should render enter email view", () => {
      enterPasswordGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("enter-password/index.njk");
    });
  });

  describe("enterPasswordPost", () => {
    it("should redirect to enter-new-email when the password is correct", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake.returns(true),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
      };
      req.body["password"] = "password";

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(PATH_NAMES.ENTER_NEW_EMAIL);
    });

    it("should bad request when user credentials are incorrect", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake.returns(false),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
      };
      req.body["password"] = "password";

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(res.render).to.have.been.called;
      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });

    it("should throw error when API call throws error", async () => {
      const error = new Error("Internal server error");
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake.throws(error),
      };

      await expect(
        enterPasswordPost(fakeService)(req as Request, res as Response)
      ).to.be.rejectedWith(Error, "Internal server error");
      expect(fakeService.authenticated).to.have.been.calledOnce;
    });
  });
});
