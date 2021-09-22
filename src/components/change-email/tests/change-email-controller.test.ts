import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import { changeEmailGet, changeEmailPost } from "../change-email-controller";
import { ChangeEmailServiceInterface } from "../types";
import { getInitialState } from "../../../utils/state-machine";

describe("change email controller", () => {
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
        tokens: { accessToken: "token" },
        email: "test@dl.com",
        state: { changeEmail: getInitialState() },
      };

      await changeEmailPost(fakeService)(req as Request, res as Response);

      expect(fakeService.sendCodeVerificationNotification).to.have.been
        .calledOnce;
      expect(res.redirect).to.have.calledWith("/check-your-email");
    });
  });
});
