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
  removeMfaMethodConfirmationGet,
} from "../update-confirmation-controller";
import { PATH_DATA } from "../../../app.constants";
import {
  AuthAppMethod,
  MfaMethod,
  SmsMethod,
} from "../../../utils/mfaClient/types";

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
    sinon.restore();
  });

  describe("updateEmailConfirmationGet", () => {
    it("should render update email confirmation page", async () => {
      await updateEmailConfirmationGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("update-confirmation/index.njk");
    });
  });

  describe("updatePasswordConfirmationGet", () => {
    it("should render update password confirmation page", async () => {
      const sessionStore = require("../../../utils/session-store");
      sandbox.stub(sessionStore, "clearCookies").callsFake(() => {});
      await updatePasswordConfirmationGet(req as Request, res as Response);
      expect(req.session.destroy).called;
      expect(res.render).to.have.calledWith("update-confirmation/index.njk");
      expect(sessionStore.clearCookies).to.have.calledWith(req, res, ["am"]);
    });
  });

  describe("updatePhoneNumberConfirmationGet", () => {
    it("should render update phone number page", async () => {
      await updatePhoneNumberConfirmationGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("update-confirmation/index.njk");
    });
  });

  describe("updateAuthenticatorAppConfirmationGet", () => {
    it("should render update authenticator app page", async () => {
      await updateAuthenticatorAppConfirmationGet(
        req as Request,
        res as Response
      );

      expect(res.render).to.have.calledWith("update-confirmation/index.njk");
    });
  });

  describe("deleteAccountConfirmationGet", () => {
    it("should render delete confirmation page", async () => {
      await deleteAccountConfirmationGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("update-confirmation/index.njk");
    });
  });

  it("removeMfaMethodConfirmationGet with removed SMS method", async () => {
    const mfaMethod: MfaMethod = {
      mfaIdentifier: "1",
      priorityIdentifier: "BACKUP",
      methodVerified: true,
      method: { mfaMethodType: "SMS", phoneNumber: "1234567890" } as SmsMethod,
    };

    req = {
      session: { removedMfaMethod: mfaMethod },
      t: sinon.fake((k: string) => k),
    };

    res = {
      render: sinon.fake(),
      redirect: sinon.fake(),
      locals: {},
    };

    await removeMfaMethodConfirmationGet(req, res);

    expect(req.session.removedMfaMethod).to.eq(undefined);
    expect(res.render).to.be.calledWith(
      "common/confirmation-page/confirmation.njk",
      {
        pageTitleName: "pages.removeBackupMethod.confirm.title",
        heading: "pages.removeBackupMethod.confirm.heading",
        message: "pages.removeBackupMethod.confirm.message_sms",
        backLinkText: "pages.removeBackupMethod.backLinkText",
        backLink: "/security",
      }
    );
    expect(res.redirect).not.to.be.called;
  });

  it("removeMfaMethodConfirmationGet with removed auth app method", async () => {
    const mfaMethod: MfaMethod = {
      mfaIdentifier: "1",
      priorityIdentifier: "BACKUP",
      methodVerified: true,
      method: { mfaMethodType: "AUTH_APP" } as AuthAppMethod,
    };

    req = {
      session: { removedMfaMethod: mfaMethod },
      t: sinon.fake((k: string) => k),
    };

    res = {
      render: sinon.fake(),
      redirect: sinon.fake(),
      locals: {},
    };

    await removeMfaMethodConfirmationGet(req, res);

    expect(req.session.removedMfaMethod).to.eq(undefined);
    expect(res.render).to.be.calledWith(
      "common/confirmation-page/confirmation.njk",
      {
        pageTitleName: "pages.removeBackupMethod.confirm.title",
        heading: "pages.removeBackupMethod.confirm.heading",
        message: "pages.removeBackupMethod.confirm.message_app",
        backLinkText: "pages.removeBackupMethod.backLinkText",
        backLink: "/security",
      }
    );
    expect(res.redirect).not.to.be.called;
  });

  it("removeMfaMethodConfirmationGet with no removed method", async () => {
    req = {
      session: {},
      t: sinon.fake((k: string) => k),
    };

    res = {
      render: sinon.fake(),
      redirect: sinon.fake(),
      locals: {},
    };

    await removeMfaMethodConfirmationGet(req, res);

    expect(res.render).not.to.be.called;
    expect(res.redirect).to.be.calledWith("/security");
  });
});

describe("addBackupAppConfirmationGet", () => {
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

  it("should render add mfa app confirmation page", async () => {
    await addMfaAppMethodConfirmationGet(req as Request, res as Response);

    expect(res.render).to.be.calledWith(
      "common/confirmation-page/confirmation.njk",
      {
        pageTitleName: "pages.confirmaddBackup.title",
        heading: "pages.confirmaddBackup.heading",
        message: "pages.confirmaddBackup.message",
        backLinkText: "pages.confirmaddBackup.backLinkText",
        backLink: PATH_DATA.SECURITY.url,
      }
    );
  });

  it("should render change default app confirmation page for AUTH_APP", async () => {
    req.session = {
      mfaMethods: [
        {
          priorityIdentifier: "DEFAULT",
          method: {
            mfaMethodType: "AUTH_APP",
            credential: "ABC",
          },
        },
      ],
    };
    await changeDefaultMethodConfirmationGet(req as Request, res as Response);

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

  it("should render change default app confirmation page for SMS", async () => {
    req.session = {
      mfaMethods: [
        {
          priorityIdentifier: "DEFAULT",
          method: {
            mfaMethodType: "SMS",
            phoneNumber: "07123456789",
          },
        },
      ],
    };
    req.t = (t: string) => {
      return t === "pages.changeDefaultMethod.confirmation.sms"
        ? "pages.changeDefaultMethod.confirmation.sms [phoneNumber]"
        : t;
    };

    await changeDefaultMethodConfirmationGet(req as Request, res as Response);

    expect(res.render).to.be.calledWith(
      "common/confirmation-page/confirmation.njk",
      {
        pageTitleName: "pages.changeDefaultMethod.confirmation.title",
        heading: "pages.changeDefaultMethod.confirmation.heading",
        message: "pages.changeDefaultMethod.confirmation.sms 6789",
        backLinkText: "pages.changeDefaultMethod.confirmation.back",
        backLink: PATH_DATA.SECURITY.url,
      }
    );
  });

  it("should throw 404 if there is no default method", async () => {
    req.session = {
      mfaMethods: [],
    };
    await changeDefaultMethodConfirmationGet(req as Request, res as Response);
    expect(res.status).to.be.calledWith(404);
  });
});
