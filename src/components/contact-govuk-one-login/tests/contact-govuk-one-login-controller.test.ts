import { expect } from "chai";
import { describe } from "mocha";
import { Request, Response } from "express";
import { sinon } from "../../../../test/utils/test-utils";
import { contactGet } from "../contact-govuk-one-login-controller";
import { logger } from "../../../utils/logger";

const CONTACT_ONE_LOGIN_TEMPLATE = "contact-govuk-one-login/index.njk";

describe("Contact GOV.UK One Login controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      cookies: { lng: "en" },
      query: {},
      session: {},
      log: logger,
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
      const validUrl = "https://home.account.gov.uk/security";
      req.query.fromURL = validUrl;
      contactGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        fromURL: validUrl,
      });
    });

    it("should render contact centre triage page when session contains fromURL", () => {
      const validUrl = "https://home.account.gov.uk/security";
      req.session = { fromURL: validUrl };
      contactGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        fromURL: validUrl,
      });
    });

    it("should render centre triage page when invalid fromURL is present", () => {
      const invalidUrl = "DROP * FROM *;";
      req.query.fromURL = invalidUrl;
      contactGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        fromURL: undefined,
      });
    });

    it("should render centre triage page when no fromURL is present", () => {
      contactGet(req as Request, res as Response);
      expect(res.render).to.have.calledWith(CONTACT_ONE_LOGIN_TEMPLATE, {
        fromURL: undefined,
      });
    });
  });
});
