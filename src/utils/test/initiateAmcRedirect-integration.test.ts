import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { initiateAmcRedirect } from "../initiateAmcRedirect.js";

vi.mock("../getAmcJwe.js", () => ({
  getAmcJwe: vi.fn().mockResolvedValue({
    jws: "header.payload.signature",
    jwe: "encrypted.jwe.token.value.here",
  }),
}));

vi.mock("../../config.js", () => ({
  getAmcAuthorizeUrl: vi.fn(() => "https://amc.example.com/authorize"),
  getAmcClientId: vi.fn(() => "test-client-id"),
  getHomeBaseUrl: vi.fn(() => "https://home.example.com"),
  getServiceDomain: vi.fn(() => "example.com"),
  getAmcCallbackBaseUrl: vi.fn(() => "https://home.example.com"),
}));

vi.mock("../../app.constants.js", () => ({
  PATH_DATA: {
    AMC_CALLBACK: { url: "/amc/callback" },
  },
}));

vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:crypto")>();
  return {
    ...actual,
    randomUUID: vi.fn(() => "integration-test-state"),
  };
});

function buildApp(initialSession: Record<string, any> = {}) {
  const app = express();
  app.use(cookieParser());

  app.use((req, _res, next) => {
    req.session = {
      ...initialSession,
      save: (cb?: (err?: any) => void) => cb?.(),
    } as any;
    next();
  });

  app.get("/test-amc", async (req, res) => {
    await initiateAmcRedirect("openid email", req, res);
  });

  return app;
}

describe("Integration:: initiateAmcRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to the AMC authorize URL", async () => {
    const app = buildApp({
      user: {
        subjectId: "sub-123",
        publicSubjectId: "pub-456",
        email: "user@example.com",
        isAuthenticated: true,
      },
    });

    const response = await request(app).get("/test-amc");

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain(
      "https://amc.example.com/authorize"
    );
  });

  it("should include all required query parameters in the redirect URL", async () => {
    const app = buildApp({
      user: {
        subjectId: "sub-123",
        publicSubjectId: "pub-456",
        email: "user@example.com",
        isAuthenticated: true,
      },
    });

    const response = await request(app).get("/test-amc");
    const location = new URL(response.headers.location);

    expect(location.searchParams.get("client_id")).toBe("test-client-id");
    expect(location.searchParams.get("scope")).toBe("openid email");
    expect(location.searchParams.get("state")).toBe("integration-test-state");
    expect(location.searchParams.get("response_type")).toBe("code");
    expect(location.searchParams.get("request")).toBe(
      "encrypted.jwe.token.value.here"
    );
    expect(location.searchParams.get("redirect_uri")).toBe(
      "https://home.example.com/amc/callback"
    );
  });

  it("should set the amc cookie on the response", async () => {
    const app = buildApp({
      user: {
        subjectId: "sub-123",
        publicSubjectId: "pub-456",
        email: "user@example.com",
        isAuthenticated: true,
      },
    });

    const response = await request(app).get("/test-amc");
    const setCookieHeader = response.headers["set-cookie"] as string[];

    expect(setCookieHeader).toBeDefined();
    const amcCookie = setCookieHeader.find((c: string) => c.startsWith("amc="));
    expect(amcCookie).toBeDefined();
    expect(amcCookie).toContain("HttpOnly");
    expect(amcCookie).toContain("Secure");
    expect(amcCookie).toContain("SameSite=Strict");
    expect(amcCookie).toContain("Domain=example.com");
  });

  it("should save the state to the session", async () => {
    let capturedSession: any;
    const app = express();
    app.use(cookieParser());

    app.use((req, _res, next) => {
      req.session = {
        user: {
          subjectId: "sub-123",
          publicSubjectId: "pub-456",
          email: "user@example.com",
          isAuthenticated: true,
        },
        save: (cb?: (err?: any) => void) => cb?.(),
      } as any;
      next();
    });

    app.get("/test-amc", async (req, res) => {
      await initiateAmcRedirect("openid email", req, res);
      capturedSession = req.session;
    });

    await request(app).get("/test-amc");

    expect(capturedSession.amcStates).toContain("integration-test-state");
  });

  it("should append state to existing amcStates in the session", async () => {
    let capturedSession: any;
    const app = express();
    app.use(cookieParser());

    app.use((req, _res, next) => {
      req.session = {
        user: {
          subjectId: "sub-123",
          publicSubjectId: "pub-456",
          email: "user@example.com",
          isAuthenticated: true,
        },
        amcStates: ["pre-existing-state"],
        save: (cb?: (err?: any) => void) => cb?.(),
      } as any;
      next();
    });

    app.get("/test-amc", async (req, res) => {
      await initiateAmcRedirect("openid email", req, res);
      capturedSession = req.session;
    });

    await request(app).get("/test-amc");

    expect(capturedSession.amcStates).toEqual([
      "pre-existing-state",
      "integration-test-state",
    ]);
  });
});
