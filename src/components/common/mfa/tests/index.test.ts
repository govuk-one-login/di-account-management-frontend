import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import * as mfaModule from "../../../../utils/mfa/index.js";
import QRCode from "qrcode";
import { renderMfaMethodPage } from "../index.js";
import { formatValidationError } from "../../../../utils/validation.js";

describe("render mfa page", () => {
  beforeEach(() => {});

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render mfa page", async () => {
    const req = {
      body: {
        code: "qrcode",
        authAppSecret: "A".repeat(20),
      },
      session: {
        id: "session_id",
        user: {
          email: "test@test.com",
          tokens: { accessToken: "token" },
          state: { changeAuthApp: ["VALUE_UPDATED"] },
        },
      },
      log: { error: vi.fn() },
      ip: "127.0.0.1",
      t: (t: string) => t,
    };
    const res = {
      locals: {
        persistentSessionId: "persistentSessionId",
      },
      render: vi.fn(),
      redirect: vi.fn(() => {}),
    };
    const next = vi.fn();

    vi.spyOn(mfaModule, "generateMfaSecret").mockImplementation(() =>
      "A".repeat(20)
    );
    vi.spyOn(mfaModule, "generateQRCodeValue").mockImplementation(
      () => "qrcode"
    );
    const templateFilePath = "abc.njk";
    await renderMfaMethodPage(
      templateFilePath,
      req as unknown as Request,
      res as unknown as Response,
      next,
      {}
    );

    expect(res.render).toHaveBeenCalledWith(templateFilePath, {
      authAppSecret: "A".repeat(20),
      qrCode: await QRCode.toDataURL("qrcode"),
      formattedSecret: "AAAA AAAA AAAA AAAA AAAA",
      backLink: undefined,
      errors: {},
      errorList: [],
    });
  });

  it("should render mfa page with error", async () => {
    const req = {
      body: {
        code: "qrcode",
        authAppSecret: "A".repeat(20),
      },
      session: {
        id: "session_id",
        user: {
          email: "test@test.com",
          tokens: { accessToken: "token" },
          state: { changeAuthApp: ["VALUE_UPDATED"] },
        },
      },
      log: { error: vi.fn() },
      ip: "127.0.0.1",
      t: (t: string) => t,
    };
    const res = {
      locals: {
        persistentSessionId: "persistentSessionId",
      },
      render: vi.fn(),
      redirect: vi.fn(() => {}),
    };
    const next = vi.fn();

    vi.spyOn(mfaModule, "generateMfaSecret").mockImplementation(() =>
      "A".repeat(20)
    );
    vi.spyOn(mfaModule, "generateQRCodeValue").mockImplementation(
      () => "qrcode"
    );
    const templateFilePath = "abc.njk";
    await renderMfaMethodPage(
      templateFilePath,
      req as unknown as Request,
      res as unknown as Response,
      next,
      formatValidationError(
        "code",
        req.t("pages.renderUpdateAuthAppPage.errors.maxLength")
      )
    );

    expect(res.render).toHaveBeenCalledWith(templateFilePath, {
      authAppSecret: "A".repeat(20),
      qrCode: await QRCode.toDataURL("qrcode"),
      formattedSecret: "AAAA AAAA AAAA AAAA AAAA",
      backLink: undefined,
      errors: {
        code: {
          text: "pages.renderUpdateAuthAppPage.errors.maxLength",
          href: "#code",
        },
      },
      errorList: [
        {
          text: "pages.renderUpdateAuthAppPage.errors.maxLength",
          href: "#code",
        },
      ],
    });
  });

  it("should pass the supplied backlink through to the template", async () => {
    const req = {
      body: {
        code: "qrcode",
        authAppSecret: "A".repeat(20),
      },
      session: {
        id: "session_id",
        user: {
          email: "test@test.com",
          tokens: { accessToken: "token" },
          state: { changeAuthenticatorApp: ["VALUE_UPDATED"] },
        },
      },
      log: { error: vi.fn() },
      ip: "127.0.0.1",
      t: (t: string) => t,
    };
    const res = {
      locals: {
        persistentSessionId: "persistentSessionId",
      },
      render: vi.fn(),
      redirect: vi.fn(() => {}),
    };
    const next = vi.fn();

    vi.spyOn(mfaModule, "generateMfaSecret").mockImplementation(() =>
      "A".repeat(20)
    );
    vi.spyOn(mfaModule, "generateQRCodeValue").mockImplementation(
      () => "qrcode"
    );
    const templateFilePath = "abc.njk";
    await renderMfaMethodPage(
      templateFilePath,
      req as unknown as Request,
      res as unknown as Response,
      next,
      undefined,
      "backlink"
    );

    expect(res.render).toHaveBeenCalledWith(templateFilePath, {
      authAppSecret: "A".repeat(20),
      qrCode: await QRCode.toDataURL("qrcode"),
      formattedSecret: "AAAA AAAA AAAA AAAA AAAA",
      errors: undefined,
      errorList: undefined,
      backLink: "backlink",
    });
  });
});
