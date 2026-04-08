import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { RequestBuilder, ResponseBuilder } from "../../../../test/utils/builders.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { UserJourney } from "../../../utils/state-machine.js";
import { PATH_DATA } from "../../../app.constants.js";
import { maxNumberOfPasskeys } from "../../../config.js";

describe("signInDetailsGet Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockRender: any;
  let mockMetrics: any;
  let mockT: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockMetrics = {
      addMetric: vi.fn(),
    };

    mockRender = vi.fn();
    mockT = vi.fn((key: string) => key);

    req = new RequestBuilder()
      .withSession({
        user: {
          email: "test@example.com",
          tokens: { accessToken: "token", idToken: "", refreshToken: "" },
          isAuthenticated: true,
          state: {},
        },
        mfaMethods: [
          {
            mfaIdentifier: "1",
            priorityIdentifier: "DEFAULT",
            method: {
              mfaMethodType: "SMS",
              phoneNumber: "07123456789",
            },
            methodVerified: true,
          },
        ],
      } as any)
      .build();

    req.metrics = mockMetrics;
    req.t = mockT;

    res = new ResponseBuilder()
      .withRender(mockRender)
      .build();
  });

  it("should add metrics when called", async () => {
    // Mock the dependencies
    vi.doMock("../../../utils/mfaClient/index.js", () => ({
      createMfaClient: vi.fn().mockResolvedValue({
        getPasskeys: vi.fn().mockResolvedValue({ success: true, data: [] }),
      }),
    }));

    vi.doMock("../../../utils/passkeys/index.js", () => ({
      formatPasskeysForRender: vi.fn().mockResolvedValue([]),
    }));

    vi.doMock("../../../utils/mfa/index.js", () => ({
      mapMfaMethods: vi.fn().mockReturnValue([]),
      canChangePrimaryMethod: vi.fn().mockReturnValue(false),
    }));

    const { signInDetailsGet } = await import("../sign-in-details-controller.js");
    
    await signInDetailsGet(req as Request, res as Response);

    expect(mockMetrics.addMetric).toHaveBeenCalledWith(
      "signInDetailsGet",
      MetricUnit.Count,
      1
    );
  });

  it("should render template with correct structure", async () => {
    // Mock the dependencies
    vi.doMock("../../../utils/mfaClient/index.js", () => ({
      createMfaClient: vi.fn().mockResolvedValue({
        getPasskeys: vi.fn().mockResolvedValue({ success: true, data: [] }),
      }),
    }));

    vi.doMock("../../../utils/passkeys/index.js", () => ({
      formatPasskeysForRender: vi.fn().mockResolvedValue([]),
    }));

    vi.doMock("../../../utils/mfa/index.js", () => ({
      mapMfaMethods: vi.fn().mockReturnValue([]),
      canChangePrimaryMethod: vi.fn().mockReturnValue(false),
    }));

    const { signInDetailsGet } = await import("../sign-in-details-controller.js");
    
    await signInDetailsGet(req as Request, res as Response);

    expect(mockRender).toHaveBeenCalledWith(
      "sign-in-details/index.njk",
      expect.objectContaining({
        email: "test@example.com",
        mfaMethods: expect.any(Array),
        canChangeTypeofPrimary: expect.any(Boolean),
        passkeys: expect.any(Array),
        enterPasswordUrls: expect.any(Object),
        maxNumberOfPasskeys: maxNumberOfPasskeys,
      })
    );
  });

  it("should construct enter password URLs with correct structure", async () => {
    // Mock the dependencies
    vi.doMock("../../../utils/mfaClient/index.js", () => ({
      createMfaClient: vi.fn().mockResolvedValue({
        getPasskeys: vi.fn().mockResolvedValue({ success: true, data: [] }),
      }),
    }));

    vi.doMock("../../../utils/passkeys/index.js", () => ({
      formatPasskeysForRender: vi.fn().mockResolvedValue([]),
    }));

    vi.doMock("../../../utils/mfa/index.js", () => ({
      mapMfaMethods: vi.fn().mockReturnValue([]),
      canChangePrimaryMethod: vi.fn().mockReturnValue(false),
    }));

    const { signInDetailsGet } = await import("../sign-in-details-controller.js");
    
    await signInDetailsGet(req as Request, res as Response);

    const baseUrl = `${PATH_DATA.ENTER_PASSWORD.url}?from=sign-in-details&edit=true`;
    
    expect(mockRender).toHaveBeenCalledWith(
      "sign-in-details/index.njk",
      expect.objectContaining({
        enterPasswordUrls: expect.objectContaining({
          changeEmail: `${baseUrl}&type=${UserJourney.ChangeEmail}`,
          createPasskey: `${baseUrl}&type=${UserJourney.CreatePasskey}`,
          removePasskey: `${baseUrl}&type=${UserJourney.RemovePasskey}`,
          changePassword: `${baseUrl}&type=${UserJourney.ChangePassword}`,
          changeDefaultMethod: `${baseUrl}&type=${UserJourney.ChangeDefaultMethod}`,
          switchBackupMethod: `${baseUrl}&type=${UserJourney.SwitchBackupMethod}`,
          removeBackupMethod: `${baseUrl}&type=${UserJourney.RemoveBackup}`,
          addBackupMethod: `${baseUrl}&type=${UserJourney.addBackup}`,
        }),
      })
    );
  });

  it("should handle missing metrics gracefully", async () => {
    delete req.metrics;

    // Mock the dependencies
    vi.doMock("../../../utils/mfaClient/index.js", () => ({
      createMfaClient: vi.fn().mockResolvedValue({
        getPasskeys: vi.fn().mockResolvedValue({ success: true, data: [] }),
      }),
    }));

    vi.doMock("../../../utils/passkeys/index.js", () => ({
      formatPasskeysForRender: vi.fn().mockResolvedValue([]),
    }));

    vi.doMock("../../../utils/mfa/index.js", () => ({
      mapMfaMethods: vi.fn().mockReturnValue([]),
      canChangePrimaryMethod: vi.fn().mockReturnValue(false),
    }));

    const { signInDetailsGet } = await import("../sign-in-details-controller.js");
    
    await signInDetailsGet(req as Request, res as Response);

    // Should not throw error and continue execution
    expect(mockRender).toHaveBeenCalled();
  });

  it("should handle different email addresses", async () => {
    const testEmail = "different@example.com";
    req.session!.user.email = testEmail;

    // Mock the dependencies
    vi.doMock("../../../utils/mfaClient/index.js", () => ({
      createMfaClient: vi.fn().mockResolvedValue({
        getPasskeys: vi.fn().mockResolvedValue({ success: true, data: [] }),
      }),
    }));

    vi.doMock("../../../utils/passkeys/index.js", () => ({
      formatPasskeysForRender: vi.fn().mockResolvedValue([]),
    }));

    vi.doMock("../../../utils/mfa/index.js", () => ({
      mapMfaMethods: vi.fn().mockReturnValue([]),
      canChangePrimaryMethod: vi.fn().mockReturnValue(false),
    }));

    const { signInDetailsGet } = await import("../sign-in-details-controller.js");
    
    await signInDetailsGet(req as Request, res as Response);

    expect(mockRender).toHaveBeenCalledWith(
      "sign-in-details/index.njk",
      expect.objectContaining({
        email: testEmail,
      })
    );
  });

  it("should handle non-array MFA methods", async () => {
    req.session!.mfaMethods = null as any;

    // Mock the dependencies
    vi.doMock("../../../utils/mfaClient/index.js", () => ({
      createMfaClient: vi.fn().mockResolvedValue({
        getPasskeys: vi.fn().mockResolvedValue({ success: true, data: [] }),
      }),
    }));

    vi.doMock("../../../utils/passkeys/index.js", () => ({
      formatPasskeysForRender: vi.fn().mockResolvedValue([]),
    }));

    vi.doMock("../../../utils/mfa/index.js", () => ({
      mapMfaMethods: vi.fn().mockReturnValue([]),
      canChangePrimaryMethod: vi.fn().mockReturnValue(false),
    }));

    const { signInDetailsGet } = await import("../sign-in-details-controller.js");
    
    await signInDetailsGet(req as Request, res as Response);

    expect(mockRender).toHaveBeenCalledWith(
      "sign-in-details/index.njk",
      expect.objectContaining({
        mfaMethods: [],
        canChangeTypeofPrimary: expect.any(Boolean),
      })
    );
  });

  it("should include maxNumberOfPasskeys from config", async () => {
    // Mock the dependencies
    vi.doMock("../../../utils/mfaClient/index.js", () => ({
      createMfaClient: vi.fn().mockResolvedValue({
        getPasskeys: vi.fn().mockResolvedValue({ success: true, data: [] }),
      }),
    }));

    vi.doMock("../../../utils/passkeys/index.js", () => ({
      formatPasskeysForRender: vi.fn().mockResolvedValue([]),
    }));

    vi.doMock("../../../utils/mfa/index.js", () => ({
      mapMfaMethods: vi.fn().mockReturnValue([]),
      canChangePrimaryMethod: vi.fn().mockReturnValue(false),
    }));

    const { signInDetailsGet } = await import("../sign-in-details-controller.js");
    
    await signInDetailsGet(req as Request, res as Response);

    expect(mockRender).toHaveBeenCalledWith(
      "sign-in-details/index.njk",
      expect.objectContaining({
        maxNumberOfPasskeys: 5, // From config
      })
    );
  });
});