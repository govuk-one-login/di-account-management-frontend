import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";

import {
  addMfaAppMethodGet,
  addMfaMethodGoBackGet,
  addMfaAppMethodPost,
} from "../add-mfa-method-app-controller.js";
import { PATH_DATA } from "../../../app.constants.js";
import * as mfaModule from "../../../utils/mfa/index.js";
import QRCode from "qrcode";

import { MfaMethod } from "../../../utils/mfaClient/types.js";
import * as mfaClient from "../../../utils/mfaClient/index.js";

describe("addMfaMethodGoBackGet", () => {
  beforeEach(() => {});

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should redirect to the method selection page", async () => {
    const req = {
      session: {
        user: { state: { addBackup: { value: "APP" } } },
      },
    };
    const res = { redirect: vi.fn(() => {}) };

    await addMfaMethodGoBackGet(
      req as unknown as Request,
      res as unknown as Response
    );

    expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.ADD_MFA_METHOD.url);
  });
});

describe("addMfaAppMethodGet", () => {
  beforeEach(() => {});

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render the add app page", async () => {
    const req = {
      session: {
        user: { email: "test@test.com" },
      },
      body: {},
      log: { error: vi.fn() },
    };
    const res = {
      render: vi.fn(),
      locals: {},
    };
    const next = vi.fn();

    vi.spyOn(mfaModule, "generateMfaSecret").mockImplementation(() =>
      "A".repeat(20)
    );
    vi.spyOn(mfaModule, "generateQRCodeValue").mockImplementation(
      () => "qrcode"
    );

    await addMfaAppMethodGet(
      req as unknown as Request,
      res as unknown as Response,
      next
    );

    expect(res.render).toHaveBeenCalledWith("add-mfa-method-app/index.njk", {
      authAppSecret: "A".repeat(20),
      qrCode: await QRCode.toDataURL("qrcode"),
      formattedSecret: "AAAA AAAA AAAA AAAA AAAA",
      backLink: "/back-from-set-up-method",
      errors: undefined,
      errorList: undefined,
    });
  });

  it("should return an error if there is no email in the session", async () => {
    const req = {
      session: { user: {} },
      log: { error: vi.fn() },
    };
    const res = {
      locals: {},
    };
    const next = vi.fn();

    await addMfaAppMethodGet(
      req as unknown as Request,
      res as unknown as Response,
      next
    );

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("addMfaAppMethodPost", () => {
  let mfaClientStub: any;
  let nextSpy: any;
  let logSpy: any;

  const appMethod = {
    mfaMethodType: "AUTH_APP" as const,
    credential: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
  };

  const mfaMethod: MfaMethod = {
    mfaIdentifier: "1",
    priorityIdentifier: "BACKUP",
    methodVerified: true,
    method: appMethod,
  };

  beforeEach(() => {
    mfaClientStub = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      retrieve: vi.fn(),
    } as any;
    vi.spyOn(mfaClient, "createMfaClient").mockResolvedValue(mfaClientStub);
    nextSpy = vi.fn();
    logSpy = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should redirect to 'Your services' when the user has the max number of MFA methods'", async () => {
    const req = {
      body: {
        code: "123456",
        authAppSecret: appMethod.credential,
      },
      session: {
        user: { state: { addBackup: { value: "APP" } } },
        mfaMethods: [
          {
            mfaIdentifier: "1",
            priorityIdentifier: "DEFAULT",
            method: { mfaMethodType: "SMS", phoneNumber: "0123456789" },
            methodVerified: true,
          },
          {
            mfaIdentifier: "2",
            priorityIdentifier: "BACKUP",
            method: { mfaMethodType: "AUTH_APP", credential: "abc123" },
            methodVerified: true,
          },
        ],
      },
      log: { error: logSpy },
      t: (t: string) => t,
    };

    const res = { redirect: vi.fn(() => {}), locals: {} };

    vi.spyOn(mfaModule, "verifyMfaCode").mockResolvedValue(true);
    vi.spyOn(mfaModule, "generateQRCodeValue").mockReturnValue("qrcode");

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      nextSpy
    );

    expect(mfaClientStub.create).not.toHaveBeenCalled();

    expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SECURITY.url);
  });

  it("should redirect to add mfa app confirmation page when successful", async () => {
    const req = {
      body: {
        code: "123456",
        authAppSecret: appMethod.credential,
      },
      session: {
        user: { state: { addBackup: { value: "APP" } } },
        mfaMethods: [] as MfaMethod[],
      },
      log: { error: logSpy },
      t: (t: string) => t,
    };

    const res = { redirect: vi.fn(() => {}), locals: {} };

    vi.spyOn(mfaModule, "verifyMfaCode").mockResolvedValue(true);
    vi.spyOn(mfaModule, "generateQRCodeValue").mockReturnValue("qrcode");

    mfaClientStub.create.mockResolvedValue({
      success: true,
      status: 200,
      data: mfaMethod,
    });

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      nextSpy
    );

    expect(mfaClientStub.create).toHaveBeenCalledWith(appMethod);

    expect(res.redirect).toHaveBeenCalledWith(
      PATH_DATA.ADD_MFA_METHOD_APP_CONFIRMATION.url
    );
  });

  it("should render an error if the code is invalid", async () => {
    const req = {
      body: {
        code: "123456",
        authAppSecret: appMethod.credential,
      },
      session: {
        user: { state: { addBackup: { value: "APP" } }, email: "email" },
        mfaMethods: [] as MfaMethod[],
      },
      log: { error: logSpy },
      t: (s: string) => s,
    };
    const res = { render: vi.fn(), locals: {} };

    vi.spyOn(mfaModule, "verifyMfaCode").mockResolvedValue(false);
    vi.spyOn(mfaModule, "generateQRCodeValue").mockReturnValue("qrcode");

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      nextSpy
    );

    expect(mfaClientStub.create).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith("add-mfa-method-app/index.njk", {
      authAppSecret: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
      qrCode: expect.any(String),
      formattedSecret: "ABCD EFGH IJKL MNOP QRST UVWX YZ23 4567",
      backLink: "/back-from-set-up-method",
      errors: {
        code: { text: "setUpAuthApp.errors.invalidCode", href: "#code" },
      },
      errorList: [{ text: "setUpAuthApp.errors.invalidCode", href: "#code" }],
    });
  });

  it("should render an error if the code is missing", async () => {
    const req = {
      body: {
        authAppSecret: appMethod.credential,
      },
      session: {
        user: { state: { addBackup: { value: "APP" } }, email: "email" },
        mfaMethods: [] as MfaMethod[],
      },
      log: { error: logSpy },
      t: (s: string) => s,
    };
    const res = { render: vi.fn(), locals: {} };

    vi.spyOn(mfaModule, "verifyMfaCode").mockResolvedValue(true);
    vi.spyOn(mfaModule, "generateQRCodeValue").mockReturnValue("qrcode");

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      nextSpy
    );

    expect(mfaClientStub.create).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith("add-mfa-method-app/index.njk", {
      authAppSecret: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
      qrCode: expect.any(String),
      formattedSecret: "ABCD EFGH IJKL MNOP QRST UVWX YZ23 4567",
      backLink: "/back-from-set-up-method",
      errors: {
        code: { text: "setUpAuthApp.errors.required", href: "#code" },
      },
      errorList: [{ text: "setUpAuthApp.errors.required", href: "#code" }],
    });
  });

  it("should render an error if the code has letters", async () => {
    const req = {
      body: {
        code: "abc123",
        authAppSecret: appMethod.credential,
      },
      session: {
        user: { state: { addBackup: { value: "APP" } }, email: "email" },
        mfaMethods: [] as MfaMethod[],
      },
      log: { error: logSpy },
      t: (s: string) => s,
    };
    const res = { render: vi.fn(), locals: {} };

    vi.spyOn(mfaModule, "verifyMfaCode").mockResolvedValue(true);
    vi.spyOn(mfaModule, "generateQRCodeValue").mockReturnValue("qrcode");

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      nextSpy
    );

    expect(mfaClientStub.create).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith("add-mfa-method-app/index.njk", {
      authAppSecret: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
      qrCode: expect.any(String),
      formattedSecret: "ABCD EFGH IJKL MNOP QRST UVWX YZ23 4567",
      backLink: "/back-from-set-up-method",
      errors: {
        code: {
          text: "setUpAuthApp.errors.invalidFormat",
          href: "#code",
        },
      },
      errorList: [{ text: "setUpAuthApp.errors.invalidFormat", href: "#code" }],
    });
  });

  it("should render an error if the code is longer than 6 digits", async () => {
    const req = {
      body: {
        code: "1234567",
        authAppSecret: appMethod.credential,
      },
      session: {
        user: { state: { addBackup: { value: "APP" } }, email: "email" },
        mfaMethods: [] as MfaMethod[],
      },
      log: { error: logSpy },
      t: (s: string) => s,
    };
    const res = { render: vi.fn(), locals: {} };

    vi.spyOn(mfaModule, "verifyMfaCode").mockResolvedValue(true);
    vi.spyOn(mfaModule, "generateQRCodeValue").mockReturnValue("qrcode");

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      nextSpy
    );

    expect(mfaClientStub.create).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith("add-mfa-method-app/index.njk", {
      authAppSecret: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
      qrCode: expect.any(String),
      formattedSecret: "ABCD EFGH IJKL MNOP QRST UVWX YZ23 4567",
      backLink: "/back-from-set-up-method",
      errors: {
        code: { text: "setUpAuthApp.errors.maxLength", href: "#code" },
      },
      errorList: [{ text: "setUpAuthApp.errors.maxLength", href: "#code" }],
    });
  });

  it("should log and throw an error if the call to the MFA API fails", async () => {
    const req = {
      body: {
        code: "123456",
        authAppSecret: appMethod.credential,
      },
      session: {
        user: { state: { addBackup: { value: "APP" } } },
        mfaMethods: [] as MfaMethod[],
      },
      log: { error: logSpy },
      t: (t: string) => t,
    };

    const res = { redirect: vi.fn(() => {}), locals: { trace: "trace" } };

    vi.spyOn(mfaModule, "verifyMfaCode").mockResolvedValue(true);
    vi.spyOn(mfaModule, "generateQRCodeValue").mockReturnValue("qrcode");

    mfaClientStub.create.mockResolvedValue({
      success: false,
      status: 400,
      data: {} as MfaMethod,
      error: {
        code: 1,
        message: "Bad request",
      },
    });

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      nextSpy
    );

    expect(logSpy).toHaveBeenCalled();
    expect(nextSpy).toHaveBeenCalledWith(expect.any(Error));
  });
});
