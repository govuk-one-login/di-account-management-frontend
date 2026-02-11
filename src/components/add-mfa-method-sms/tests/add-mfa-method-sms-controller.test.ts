import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import {
  RequestBuilder,
  ResponseBuilder,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import {
  addMfaSmsMethodPost,
  addMfaSmsMethodGet,
  addMfaSmsMethodConfirmationGet,
} from "../add-mfa-method-sms-controller.js";
import { ERROR_CODES, PATH_DATA } from "../../../app.constants";
import { ChangePhoneNumberServiceInterface } from "../../change-phone-number/types";
import * as oidcModule from "../../../utils/oidc.js";

describe("addMfaSmsMethodPost", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ addBackup: { value: "CHANGE_VALUE" } })
      .withTranslate(vi.fn((id) => id))
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .build();

    res = new ResponseBuilder()
      .withRender(vi.fn())
      .withRedirect(vi.fn())
      .withStatus(vi.fn())
      .build();

    vi.spyOn(oidcModule, "refreshToken").mockImplementation(async () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should redirect the user to the check phone page", async () => {
    const fakeService: ChangePhoneNumberServiceInterface = {
      sendPhoneVerificationNotification: vi.fn().mockResolvedValue({
        success: true,
      }),
    };
    req.body.phoneNumber = "07123456789";

    await addMfaSmsMethodPost(fakeService)(req as Request, res as Response);
    expect(req.session?.user.newPhoneNumber).toBe("07123456789");
    expect(res.redirect).toHaveBeenCalledWith(
      `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=addBackup`
    );
    expect(res.render).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should display errors when trying to change phone number to the existing phone number", async () => {
    const fakeService: ChangePhoneNumberServiceInterface = {
      sendPhoneVerificationNotification: vi.fn().mockResolvedValue({
        success: false,
        code: ERROR_CODES.NEW_PHONE_NUMBER_SAME_AS_EXISTING,
      }),
    };
    if (req.session) {
      req.session.save = vi.fn();
    }

    await addMfaSmsMethodPost(fakeService)(req as Request, res as Response);
    expect(req.session?.save).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith("add-mfa-method-sms/index.njk.js", {
      errors: {
        phoneNumber: {
          text: "pages.changePhoneNumber.validationError.samePhoneNumber",
          href: "#phoneNumber",
        },
      },
      errorList: [
        {
          text: "pages.changePhoneNumber.validationError.samePhoneNumber",
          href: "#phoneNumber",
        },
      ],
      backLink: "/back-from-set-up-method",
      language: "en",
    });
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("addMfaSmsMethodGet", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = new RequestBuilder().build();

    res = new ResponseBuilder().withRender(vi.fn()).build();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call render with the expected arguments", async () => {
    await addMfaSmsMethodGet(req as Request, res as Response);
    expect(res.render).toHaveBeenCalledWith("add-mfa-method-sms/index.njk.js", {
      backLink: "/back-from-set-up-method",
    });
  });
});

describe("addMfaSmsMethodConfirmationGet", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ changePhoneNumber: { value: "CHANGE_VALUE" } })
      .withTranslate(vi.fn((id) => id))
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .build();

    res = new ResponseBuilder().withRender(vi.fn()).build();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call render with the expected arguments when confirming", async () => {
    await addMfaSmsMethodConfirmationGet(req as Request, res as Response);
    expect(res.render).toHaveBeenCalledWith("update-confirmation/index.njk", {
      pageTitle: "pages.addBackupSms.confirm.title",
      panelText: "pages.addBackupSms.confirm.heading",
      summaryText: "pages.addBackupSms.confirm.message",
    });
  });

  it("should clear the user's state", async () => {
    await addMfaSmsMethodConfirmationGet(req as Request, res as Response);
    expect(req.session.user.state.changePhoneNumber).toBeUndefined();
  });
});
