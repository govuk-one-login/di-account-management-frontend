import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
  changeDefaultMfaMethodConfirmationGet,
} from "../update-confirmation-controller.js";
import {
  AuthAppMethod,
  MfaMethod,
  SmsMethod,
} from "../../../utils/mfaClient/types";
import { RequestBuilder } from "../../../../test/utils/builders";

describe("update confirmation controller", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {
      body: {},
      session: {
        user: { state: {}, email: "test@test.com", phoneNumber: "1234567890" },
        destroy: vi.fn(),
      } as any,
      t: vi.fn().mockReturnValue("translated-string"),
      metrics: { addMetric: vi.fn() },
    };
    res = {
      render: vi.fn(),
      redirect: vi.fn(() => {}),
      locals: {},
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.restoreAllMocks();
  });

  describe("updateEmailConfirmationGet", () => {
    it("should render update email confirmation page", async () => {
      updateEmailConfirmationGet(req as Request, res as Response);

      expect(res.render).toHaveBeenCalledWith(
        "update-confirmation/index.njk",
        expect.objectContaining({
          pageTitle: "translated-string",
          panelText: "translated-string",
        })
      );
    });
  });

  describe("updatePasswordConfirmationGet", () => {
    it("should render update password confirmation page", async () => {
      updatePasswordConfirmationGet(req as Request, res as Response);
      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.render).toHaveBeenCalledWith("update-confirmation/index.njk", {
        pageTitle: "translated-string",
        panelText: "translated-string",
      });
    });
  });

  describe("updatePhoneNumberConfirmationGet", () => {
    it("should render update phone number page", async () => {
      updatePhoneNumberConfirmationGet(req as Request, res as Response);

      expect(res.render).toHaveBeenCalledWith(
        "update-confirmation/index.njk",
        expect.objectContaining({
          pageTitle: "translated-string",
          panelText: "translated-string",
        })
      );
    });
  });

  describe("updateAuthenticatorAppConfirmationGet", () => {
    it("should render update authenticator app page", async () => {
      updateAuthenticatorAppConfirmationGet(req as Request, res as Response);

      expect(res.render).toHaveBeenCalledWith("update-confirmation/index.njk", {
        pageTitle: "translated-string",
        panelText: "translated-string",
        summaryText: "translated-string",
      });
    });
  });

  describe("changeDefaultMfaMethodConfirmationGet", () => {
    it("should render update default mfa method page", async () => {
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
      await changeDefaultMfaMethodConfirmationGet(
        req as Request,
        res as Response
      );

      expect(res.render).toHaveBeenCalledWith("update-confirmation/index.njk", {
        pageTitle: req.t("pages.switchBackupMethod.confirm.title"),
        panelText: req.t("pages.switchBackupMethod.confirm.heading"),
        summaryText: req.t("pages.switchBackupMethod.confirm.messageApp"),
      });
    });
  });

  describe("deleteAccountConfirmationGet", () => {
    it("should render delete confirmation page", async () => {
      deleteAccountConfirmationGet(req as Request, res as Response);

      expect(res.render).toHaveBeenCalledWith(
        "update-confirmation/index.njk",
        expect.objectContaining({
          pageTitle: "translated-string",
          panelText: "translated-string",
        })
      );
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
      t: vi.fn((k: string) => k),
    };

    res = {
      render: vi.fn(),
      redirect: vi.fn(),
      locals: {},
    };

    await removeMfaMethodConfirmationGet(req, res);

    expect(req.session.removedMfaMethod).toBe(undefined);
    expect(res.render).toHaveBeenCalledWith("update-confirmation/index.njk", {
      pageTitle: "pages.removeBackupMethod.confirm.title",
      panelText: "pages.removeBackupMethod.confirm.heading",
      summaryText: "pages.removeBackupMethod.confirm.message_sms",
    });
    expect(res.redirect).not.toHaveBeenCalled();
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
      t: vi.fn((k: string) => k),
    };

    res = {
      render: vi.fn(),
      redirect: vi.fn(),
      locals: {},
    };

    await removeMfaMethodConfirmationGet(req, res);

    expect(req.session.removedMfaMethod).toBe(undefined);
    expect(res.render).toHaveBeenCalledWith("update-confirmation/index.njk", {
      pageTitle: "pages.removeBackupMethod.confirm.title",
      panelText: "pages.removeBackupMethod.confirm.heading",
      summaryText: "pages.removeBackupMethod.confirm.message_app",
    });
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it("removeMfaMethodConfirmationGet with no removed method", async () => {
    req = {
      session: {},
      t: vi.fn((k: string) => k),
    };

    res = {
      render: vi.fn(),
      redirect: vi.fn(),
      locals: {},
    };

    await removeMfaMethodConfirmationGet(req, res);

    expect(res.render).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("/security");
  });
});

describe("addBackupAppConfirmationGet", () => {
  let req: any;
  let res: Partial<Response>;

  beforeEach(() => {
    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ addBackup: { value: "CHANGE_VALUE" } })
      .withTranslate(vi.fn((id) => id))
      .build();

    res = {
      render: vi.fn(),
      locals: {},
      status: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render add mfa app confirmation page", async () => {
    await addMfaAppMethodConfirmationGet(req as Request, res as Response);

    expect(res.render).toHaveBeenCalledWith("update-confirmation/index.njk", {
      pageTitle: "pages.confirmaddBackup.title",
      panelText: "pages.confirmaddBackup.heading",
      summaryText: "pages.confirmaddBackup.message",
    });
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

    expect(res.render).toHaveBeenCalledWith("update-confirmation/index.njk", {
      pageTitle: "pages.changeDefaultMethod.confirmation.title",
      panelText: "pages.changeDefaultMethod.confirmation.heading",
      summaryText: "pages.changeDefaultMethod.confirmation.app",
    });
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

    expect(res.render).toHaveBeenCalledWith("update-confirmation/index.njk", {
      pageTitle: "pages.changeDefaultMethod.confirmation.title",
      panelText: "pages.changeDefaultMethod.confirmation.heading",
      summaryText: "pages.changeDefaultMethod.confirmation.sms 6789",
    });
  });

  it("should throw 404 if there is no default method", async () => {
    req.session = {
      mfaMethods: [],
    };
    await changeDefaultMethodConfirmationGet(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should clear the user's state", async () => {
    await addMfaAppMethodConfirmationGet(req as Request, res as Response);
    expect(req.session.user.state.addBackup).toBeUndefined();
  });
});
