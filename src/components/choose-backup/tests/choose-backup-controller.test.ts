import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";

import {
  chooseBackupGet,
  chooseBackupPost,
} from "../choose-backup-controller.js";
import { PATH_DATA } from "../../../app.constants";
import { EventType } from "../../../utils/state-machine.js";

describe("addBackupGet", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {},
      session: {
        user: { state: { addBackup: { value: EventType.Authenticated } } },
      } as any,
      cookies: { lng: "en" },
      i18n: { language: "en" },
      t: vi.fn(),
      log: { error: vi.fn() },
    };
    res = {
      render: vi.fn(),
      redirect: vi.fn(() => {}),
      locals: {},
      status: vi.fn().mockReturnThis() as ReturnType<typeof vi.fn>,
      end: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should add mfa method page", () => {
    chooseBackupGet(req as Request, res as Response);

    expect(res.render).toHaveBeenCalledWith("choose-backup/index.njk", {
      mfaMethods: [],
    });
  });

  it("should handle a single mfa method", () => {
    req.session.mfaMethods = [
      {
        mfaIdentifier: "111111",
        methodVerified: true,
        method: {
          credential: "ABC",
          mfaMethodType: "AUTH_APP",
        },
        priorityIdentifier: "DEFAULT",
      },
    ];
    chooseBackupGet(req as Request, res as Response);

    expect(res.render).toHaveBeenCalledWith("choose-backup/index.njk", {
      mfaMethods: [],
      showSingleMethod: true,
    });
  });

  it("should handle two mfa methods", () => {
    req.session.mfaMethods = [
      {
        mfaIdentifier: "111111",
        methodVerified: true,
        method: {
          phoneNumber: "070",
          mfaMethodType: "SMS",
        },
        priorityIdentifier: "DEFAULT",
      },
      {
        mfaIdentifier: "2222",
        methodVerified: true,
        method: {
          phoneNumber: "070",
          mfaMethodType: "SMS",
        },
        priorityIdentifier: "BACKUP",
      },
    ];
    chooseBackupGet(req as Request, res as Response);

    expect(res.render).toHaveBeenCalledWith("choose-backup/index.njk", {
      mfaMethods: req.session.mfaMethods,
    });
  });

  it("should handle mor than two mfa methods", () => {
    req.session.mfaMethods = [
      {
        mfaIdentifier: "111111",
        methodVerified: true,
        method: {
          phoneNumber: "070",
          mfaMethodType: "SMS",
        },
        priorityIdentifier: "DEFAULT",
      },
      {
        mfaIdentifier: "22222",
        methodVerified: true,
        method: {
          phoneNumber: "070",
          mfaMethodType: "SMS",
        },
        priorityIdentifier: "BACKUP",
      },
      {
        mfaIdentifier: "33333",
        methodVerified: true,
        method: {
          phoneNumber: "070",
          mfaMethodType: "SMS",
        },
        priorityIdentifier: "BACKUP",
      },
    ];
    chooseBackupGet(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("addBackupPost", () => {
  let req: any;
  let res: Partial<Response>;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const endFake = vi.fn((chunk?: any, encoding?: any, cb?: () => void) => {
      if (typeof chunk === "function") {
        // Called as end(cb)
        chunk();
      } else if (typeof encoding === "function") {
        // Called as end(chunk, cb)
        encoding();
      } else if (cb) {
        // Called as end(chunk, encoding, cb)
        cb();
      }
      return {} as Response; // You should return a proper type here, matching your test environment needs
    });
    req = {
      body: {},
      log: { error: vi.fn() } as any,
      session: {
        user: { state: { addBackup: { value: "SMS" } } },
      } as any,
    };
    res = {
      status: vi.fn(),
      redirect: vi.fn(() => {}),
      end: endFake,
      locals: {},
    } as Partial<Response>;
    next = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should take the use to the add backup phone number page when that option is selected", () => {
    req.body.addBackup = "sms";

    chooseBackupPost(req as Request, res as Response, next);

    expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.ADD_MFA_METHOD_SMS.url);
  });

  it("should take the user to the add auth app page when the user selects that option", () => {
    req.body.addBackup = "app";

    chooseBackupPost(req as Request, res as Response, next);

    expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.ADD_MFA_METHOD_APP.url);
  });

  it("should call next with an error when addBackup is unknown", () => {
    req.body.addBackup = "unknown";

    chooseBackupPost(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Unknown addBackup: unknown",
      })
    );
  });
});
