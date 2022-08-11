import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";

import { securityCodeInvalidGet } from "../security-code-error-controller";
import { Request, Response } from "express";
import { SecurityCodeErrorType } from "../../../app.constants";

describe("security code  controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
        body: {},
        session: { user: { state: { securityCodeError: {} } } },
        i18n: { language: "" },
        t: sandbox.fake(),
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
    sinon.restore();
  });

  describe("securityCodeExpiredGet", () => {
    it("should render security code expired view", () => {
      req.query.actionType = SecurityCodeErrorType.OtpMaxCodesSent;

      securityCodeInvalidGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("security-code-error/index.njk");
    });
  });
});
