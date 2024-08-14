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
  updateAuthenticatorAppConfirmationGet,
  changeDefaultMethodConfirmationGet,
} from "../update-confirmation-controller";
import { PATH_DATA } from "../../../app.constants";

describe("update confirmation controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: any;
  let res: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: { user: { state: {} }, destroy: sandbox.fake() } as any,
      t: sandbox.fake.returns("translated-string"),
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      locals: {},
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
      const sessionStore = require("../../../utils/session-store");
      sandbox.stub(sessionStore, "clearCookies").callsFake(() => {});
      updatePasswordConfirmationGet(req as Request, res as Response);
      expect(req.session.destroy).called;
      expect(res.render).to.have.calledWith("update-confirmation/index.njk");
      expect(sessionStore.clearCookies).to.have.calledWith(req, res, ["am"]);
    });
  });

  describe("updatePhoneNumberConfirmationGet", () => {
    it("should render update phone number page", () => {
      updatePhoneNumberConfirmationGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("update-confirmation/index.njk");
    });
  });

  describe("updateAuthenticatorAppConfirmationGet", () => {
    it("should render update authenticator app page", () => {
      updateAuthenticatorAppConfirmationGet(req as Request, res as Response);

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
  let req: any;
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

  it("should render change default app confimration page", () => {
    req.session = {
      mfaMethods: [
        {
          priorityIdentifier: "DEFAULT",
          method: {
            mfaMethodType: "AUTH_APP",
            endPoint: "12345678",
          },
        },
      ],
    };
    changeDefaultMethodConfirmationGet(req as Request, res as Response);

    expect(res.render).to.be.calledWith(
      "common/confirmation-page/confirmation.njk",
      {
        pageTitleName: "pages.changeDefaultMethod.confirmation.title",
        heading: "pages.changeDefaultMethod.confirmation.heading",
        message: "pages.changeDefaultMethod.confirmation.app",
        backLinkText: "pages.changeDefaultMethod.confirmation.back",
        backLink: PATH_DATA.SECURITY.url,
      }
    );
  });

  it("should throw 404 if there is no default method", () => {
    req.session = {
      mfaMethods: [],
    };
    changeDefaultMethodConfirmationGet(req as Request, res as Response);
    expect(res.status).to.be.calledWith(404);
  });
});
