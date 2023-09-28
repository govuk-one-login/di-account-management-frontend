import { expect } from "chai";
import { describe } from "mocha";
import { Request, Response } from "express";

import { sinon } from "../../../../test/utils/test-utils";

import { contactGet } from "../contact-govuk-one-login-controller";

describe("Contact GOV.UK One Login controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      cookies: { lng: "en" },
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(),
      locals: {},
      status: sandbox.fake(),
    };

    process.env.SUPPORT_TRIAGE_PAGE = "1";
  });

  afterEach(() => {
    sandbox.restore();
    delete process.env.SUPPORT_TRIAGE_PAGE;
  });

  describe("contactGet", () => {
    it("should render contact centre triage page", () => {
      contactGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith(
        "contact-govuk-one-login/index.njk"
      );
    });
  });
});
