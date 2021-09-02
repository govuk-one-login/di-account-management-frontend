import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  enterNewEmailGet,
  enterNewEmailPost,
} from "../enter-new-email-controller";
import { EnterNewEmailServiceInterface } from "../types";

describe("enter new email controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = { body: {}, session: { user: {} } };
    res = { render: sandbox.fake(), redirect: sandbox.fake(), locals: {} };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("enterNewEmailGet", () => {
    it("should render enter new email", () => {
      enterNewEmailGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("enter-new-email/index.njk");
    });
  });

  describe("enterEmailPost", () => {
    it("should redirect to email-updated-confirmation on submit", async () => {
      const fakeService: EnterNewEmailServiceInterface = {
        updateEmail: sandbox.fake(),
      };

      req.body.email = "test.test.com";

      await enterNewEmailPost(fakeService)(req as Request, res as Response);

      expect(fakeService.updateEmail).to.have.been.calledOnce;
      expect(res.redirect).to.have.calledWith("/email-updated-confirmation");
    });

    it("should throw error when API call throws error", async () => {
      const error = new Error("Internal server error");
      const fakeService: EnterNewEmailServiceInterface = {
        updateEmail: sandbox.fake.throws(error),
      };

      await expect(
        enterNewEmailPost(fakeService)(req as Request, res as Response)
      ).to.be.rejectedWith(Error, "Internal server error");
      expect(fakeService.updateEmail).to.have.been.calledOnce;
    });
  });
});
