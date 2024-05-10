import { expect } from "chai";
import { describe, it } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  addMfaAppMethodConfirmationGet,
  deleteAccountConfirmationGet,
  updateEmailConfirmationGet,
  updatePasswordConfirmationGet,
  updatePhoneNumberConfirmationGet,
} from "../update-confirmation-controller";
import { PATH_DATA } from "../../../app.constants";

describe("update confirmation controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      cookies: { _csrf: "dasdasdas", lo: "false", lng: "en", am: "dsadasdasd" },
      session: { user: { state: {} }, destroy: sandbox.fake() } as any,
      t: sandbox.fake.returns("translated-string"),
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      locals: {},
      clearCookie: sandbox.fake(() => {}),
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("updateEmailConfirmationGet", () => {
    it("should render update email confirmation page", () => {
      updateEmailConfirmationGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("update-confirmation/index.njk");
    });
  });

  describe("updatePasswordConfirmationGet", () => {
    it("should render update password confirmation page", () => {
      updatePasswordConfirmationGet(req as Request, res as Response);
      expect(res.clearCookie).to.have.calledWith("am");
      expect(req.session.destroy).called;
      expect(res.render).to.have.calledWith("update-confirmation/index.njk");
    });
  });

  describe("updatePhoneNumberConfirmationGet", () => {
    it("should render update phone number page", () => {
      updatePhoneNumberConfirmationGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("update-confirmation/index.njk");
    });
  });

  describe("deleteAccountConfirmationGet", () => {
    it("should render delete confirmation page", () => {
      deleteAccountConfirmationGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("update-confirmation/index.njk");
    });
  });
});

describe("addMfaMethodAppConfirmationGet", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      cookies: { lng: "en" },
      i18n: { language: "en" },
      t: (t: string) => t,
    };
    res = {
      render: sandbox.fake(),
      locals: {},
      status: sandbox.fake(),
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should render add mfa app confirmation page", () => {
    addMfaAppMethodConfirmationGet(req as Request, res as Response);

    expect(res.render).to.be.calledWith(
      "common/confirmation-page/confirmation.njk",
      {
        pageTitleName: "pages.confirmAddMfaMethod.title",
        heading: "pages.confirmAddMfaMethod.heading",
        message: "pages.confirmAddMfaMethod.message",
        backLinkText: "pages.confirmAddMfaMethod.backLinkText",
        backLink: PATH_DATA.SECURITY.url,
      }
    );
  });
});
