import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { createNewPasskeyGet } from "../create-new-passkey-controller.js";
import { PATH_DATA } from "../../../app.constants.js";
import * as mfaClient from "../../../utils/mfaClient/index.js";
import * as initiateAmcRedirectModule from "../../../utils/initiateAmcRedirect.js";
import { maxNumberOfPasskeys } from "../../../config.js";

describe("createNewPasskeyGet", () => {
  let mfaClientStub: any;
  let req: any;
  let res: any;

  beforeEach(() => {
    mfaClientStub = {
      getPasskeys: vi.fn(),
    };
    vi.spyOn(mfaClient, "createMfaClient").mockResolvedValue(mfaClientStub);
    vi.spyOn(
      initiateAmcRedirectModule,
      "initiateAmcRedirect"
    ).mockResolvedValue();

    req = { session: { user: {} } };
    res = { redirect: vi.fn(() => {}) };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should redirect to start page when passkeys are at max limit", async () => {
    mfaClientStub.getPasskeys.mockResolvedValue({
      data: new Array(maxNumberOfPasskeys),
    });

    await createNewPasskeyGet(req as Request, res as Response);

    expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SIGN_IN_DETAILS.url);
    expect(
      initiateAmcRedirectModule.initiateAmcRedirect
    ).not.toHaveBeenCalled();
  });

  it("should redirect to start page when passkeys exceed max limit", async () => {
    mfaClientStub.getPasskeys.mockResolvedValue({
      data: new Array(maxNumberOfPasskeys + 1),
    });

    await createNewPasskeyGet(req as Request, res as Response);

    expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SIGN_IN_DETAILS.url);
    expect(
      initiateAmcRedirectModule.initiateAmcRedirect
    ).not.toHaveBeenCalled();
  });

  it("should initiate AMC redirect with passkey-create scope when under max passkeys", async () => {
    mfaClientStub.getPasskeys.mockResolvedValue({
      data: [],
    });

    await createNewPasskeyGet(req as Request, res as Response);

    expect(initiateAmcRedirectModule.initiateAmcRedirect).toHaveBeenCalledWith(
      "passkey-create",
      req,
      res
    );
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it("should initiate AMC redirect when passkeys are one below max", async () => {
    mfaClientStub.getPasskeys.mockResolvedValue({
      data: new Array(maxNumberOfPasskeys - 1),
    });

    await createNewPasskeyGet(req as Request, res as Response);

    expect(initiateAmcRedirectModule.initiateAmcRedirect).toHaveBeenCalledWith(
      "passkey-create",
      req,
      res
    );
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
