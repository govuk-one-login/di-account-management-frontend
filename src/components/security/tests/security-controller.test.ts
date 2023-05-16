import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { securityGet } from "../security-controller";

describe("security controller", () => {
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

  describe("securityGet", () => {
    it("should render security view", () => {
      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        isPhoneNumberVerified: true,
      };
      securityGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security/index.njk", {
        email: "test@test.com",
        phoneNumber: "7898",
        isPhoneNumberVerified: true,
        manageEmailsLink: "https://www.gov.uk/email/manage",
      });
    });
  });
});
