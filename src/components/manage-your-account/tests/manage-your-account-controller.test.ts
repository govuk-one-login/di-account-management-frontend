import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { manageYourAccountGet } from "../manage-your-account-controller";

describe("manage you account controller", () => {
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

  describe("manageYourAccountGet", () => {
    it("should render manage your account view", () => {
      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
      };
      manageYourAccountGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("manage-your-account/index.njk");
    });
  });
});
