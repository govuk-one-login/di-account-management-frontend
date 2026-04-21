import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { initiateAmcRedirect } from "./initiateAmcRedirect.js";
import * as getAmcJweModule from "./getAmcJwe.js";
import * as config from "../config.js";

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
  getServiceDomain: vi.fn(() => "example.com"),
  getAmcCallbackBaseUrl: vi.fn(() => "https://home.example.com"),
}));

vi.mock("../app.constants.js", () => ({
  PATH_DATA: {
    AMC_CALLBACK: { url: "/amc/callback" },
  },
}));

describe("initiateAmcRedirect", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      session: {
        user: {
          subjectId: "internal-sub-123",
          publicSubjectId: "public-sub-456",
          email: "user@example.com",
          isAuthenticated: true,
        },
      } as any,
    };

    res = {
      cookie: vi.fn(),
      redirect: vi.fn(),
    };

    vi.mocked(getAmcJweModule.getAmcJwe).mockResolvedValue({
      jws: "test.jws.value",
      jwe: "test.jwe.value",
    });
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
      }
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

  it("should set the cookie domain from getServiceDomain()", async () => {
    vi.spyOn(config, "getServiceDomain").mockReturnValue("account.gov.uk");

    await initiateAmcRedirect("openid email", req as Request, res as Response);

    expect(res.cookie).toHaveBeenCalledWith(
      "amc",
      expect.any(String),
      expect.objectContaining({ domain: "account.gov.uk" })
    );
  });

  it("should call res.redirect exactly once", async () => {
    await initiateAmcRedirect("openid email", req as Request, res as Response);

    expect(res.redirect).toHaveBeenCalledTimes(1);
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
