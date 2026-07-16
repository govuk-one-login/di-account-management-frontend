import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { initiateAmcRedirect } from "./initiateAmcRedirect.js";
import * as getAmcJweModule from "./getAmcJwe.js";
import * as config from "../config.js";
import { eventService } from "../services/event-service.js";
import { EventName } from "../app.constants.js";

vi.mock("node:crypto", () => ({
  randomUUID: vi.fn(() => "test-state-uuid"),
  createHash: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(() => "hashed-jws-value"),
  })),
}));

vi.mock("./getAmcJwe.js", () => ({
  getAmcJwe: vi.fn(),
}));

vi.mock("../config.js", () => ({
  getAmcAuthorizeUrl: vi.fn(() => "https://amc.example.com/authorize"),
  getAmcClientId: vi.fn(() => "test-client-id"),
  getHomeBaseUrl: vi.fn(() => "https://home.example.com"),
  getRootDomain: vi.fn(() => "example.com"),
  getAmcCallbackBaseUrl: vi.fn(() => "https://home.example.com"),
  getLogLevel: vi.fn(() => "info"),
}));

vi.mock("../services/event-service.js");

vi.mock("../app.constants.js", () => ({
  EventName: vi.fn(() => ""),
  ERROR_MESSAGES: vi.fn(() => ""),
  LOG_MESSAGES: vi.fn(() => ""),
  PATH_DATA: {
    AMC_CALLBACK: { url: "/amc/callback" },
  },
}));

describe("initiateAmcRedirect", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  let mockEventService: {
    buildAuditEvent: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockEventService = {
      buildAuditEvent: vi.fn().mockReturnValue({ event_name: "test-event" }),
      send: vi.fn(),
    };
    vi.mocked(eventService).mockReturnValue(mockEventService as any);

    req = {
      session: {
        user: {
          subjectId: "internal-sub-123",
          publicSubjectId: "public-sub-456",
          email: "user@example.com",
          isAuthenticated: true,
          tokens: {
            accountDataApiAccessToken: "test-account-data-token",
          },
        },
      } as any,
      log: { error: vi.fn() },
    };

    res = {
      cookie: vi.fn(),
      redirect: vi.fn(),
      locals: { trace: "test-trace" },
    };

    vi.mocked(getAmcJweModule.getAmcJwe).mockResolvedValue({
      jws: "test.jws.value",
      jwe: "test.jwe.value",
      redirectUri: "https://home.example.com/amc/callback",
    });

    // Reset all config mocks to default values
    vi.spyOn(config, "getAmcAuthorizeUrl").mockReturnValue(
      "https://amc.example.com/authorize"
    );
    vi.spyOn(config, "getAmcClientId").mockReturnValue("test-client-id");
    vi.spyOn(config, "getRootDomain").mockReturnValue("example.com");
  });

  it("should generate a state and push it into session.amcStates", async () => {
    await initiateAmcRedirect("openid email", req as Request, res as Response);

    expect(req.session.amcStates).toEqual(["test-state-uuid"]);
  });

  it("should append to existing amcStates rather than overwrite", async () => {
    req.session.amcStates = ["existing-state"];

    await initiateAmcRedirect("openid email", req as Request, res as Response);

    expect(req.session.amcStates).toEqual([
      "existing-state",
      "test-state-uuid",
    ]);
  });

  it("should call getAmcJwe with correct arguments", async () => {
    await initiateAmcRedirect("openid email", req as Request, res as Response);

    expect(getAmcJweModule.getAmcJwe).toHaveBeenCalledWith(
      "openid email",
      "test-state-uuid",
      {
        internalPairwiseId: "internal-sub-123",
        publicSubjectId: "public-sub-456",
        email: "user@example.com",
      },
      undefined,
      "test-account-data-token"
    );
  });

  it("should redirect to the AMC authorize URL with correct query parameters", async () => {
    await initiateAmcRedirect("openid email", req as Request, res as Response);

    const redirectUrl = String(vi.mocked(res.redirect).mock.calls[0][0]);
    const url = new URL(redirectUrl);

    expect(url.origin + url.pathname).toBe("https://amc.example.com/authorize");
    expect(url.searchParams.get("client_id")).toBe("test-client-id");
    expect(url.searchParams.get("scope")).toBe("openid email");
    expect(url.searchParams.get("state")).toBe("test-state-uuid");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("request")).toBe("test.jwe.value");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://home.example.com/amc/callback"
    );
  });

  it("should use redirectUri from getAmcJwe result", async () => {
    vi.mocked(getAmcJweModule.getAmcJwe).mockResolvedValue({
      jws: "test.jws.value",
      jwe: "test.jwe.value",
      redirectUri: "https://custom.domain.com/callback?scope=openid"
    });

    await initiateAmcRedirect("openid", req as Request, res as Response);

    const redirectUrl = String(vi.mocked(res.redirect).mock.calls[0][0]);
    const url = new URL(redirectUrl);

    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://custom.domain.com/callback?scope=openid"
    );
  });

  it("should handle different scopes correctly", async () => {
    const scope = "openid profile email";
    await initiateAmcRedirect(scope, req as Request, res as Response);

    expect(getAmcJweModule.getAmcJwe).toHaveBeenCalledWith(
      scope,
      "test-state-uuid",
      expect.any(Object),
      undefined,
      "test-account-data-token"
    );

    const redirectUrl = String(vi.mocked(res.redirect).mock.calls[0][0]);
    const url = new URL(redirectUrl);
    expect(url.searchParams.get("scope")).toBe(scope);
  });

  it("should set the amc cookie with a SHA256 hash of the JWS", async () => {
    await initiateAmcRedirect("openid email", req as Request, res as Response);

    expect(res.cookie).toHaveBeenCalledWith(
      "amc",
      "hashed-jws-value",
      expect.objectContaining({
        secure: true,
        httpOnly: true,
        sameSite: "strict",
        domain: "example.com",
      })
    );
  });

  it("should set the cookie domain from getRootDomain()", async () => {
    vi.spyOn(config, "getRootDomain").mockReturnValue("account.gov.uk");

    await initiateAmcRedirect("openid email", req as Request, res as Response);

    expect(res.cookie).toHaveBeenCalledWith(
      "amc",
      expect.any(String),
      expect.objectContaining({ domain: "account.gov.uk" })
    );
  });

  it("should send HOME_AMC_AUTHORISATION_REQUESTED event", async () => {
    await initiateAmcRedirect(
      "passkey-create",
      req as Request,
      res as Response
    );

    expect(mockEventService.buildAuditEvent).toHaveBeenCalledWith(
      req,
      res,
      EventName.HOME_AMC_AUTHORISATION_REQUESTED,
      {
        amc_scope: "passkey-create",
      }
    );

    expect(mockEventService.send).toHaveBeenCalledWith(
      { event_name: "test-event" },
      "test-trace"
    );
    expect(res.redirect).toHaveBeenCalledTimes(1);
  });

  it("should call res.redirect exactly once", async () => {
    await initiateAmcRedirect("openid email", req as Request, res as Response);

    expect(res.redirect).toHaveBeenCalledTimes(1);
  });

  it("should handle missing account data token gracefully", async () => {
    req.session.user.tokens = {};

    await initiateAmcRedirect("openid email", req as Request, res as Response);

    expect(getAmcJweModule.getAmcJwe).toHaveBeenCalledWith(
      "openid email",
      "test-state-uuid",
      {
        internalPairwiseId: "internal-sub-123",
        publicSubjectId: "public-sub-456",
        email: "user@example.com",
      },
      undefined,
      undefined
    );
  });

  it("should create SHA256 hash of JWS correctly", async () => {
    await initiateAmcRedirect("openid email", req as Request, res as Response);

    expect(res.cookie).toHaveBeenCalledWith(
      "amc",
      "hashed-jws-value",
      expect.objectContaining({
        secure: true,
        httpOnly: true,
        sameSite: "strict",
        domain: "example.com",
      })
    );
  });

  it("should propagate errors thrown by getAmcJwe", async () => {
    vi.mocked(getAmcJweModule.getAmcJwe).mockRejectedValue(
      new Error("JWE generation failed")
    );

    await expect(
      initiateAmcRedirect("openid email", req as Request, res as Response)
    ).rejects.toThrow("JWE generation failed");
  });
});
