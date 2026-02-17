import { describe, it, expect } from "vitest";
import {
  helmetConfiguration,
  webchatHelmetConfiguration,
} from "../../../src/config/helmet.js";
import { Request, Response } from "express";

describe("helmet config", () => {
  describe("helmetConfiguration", () => {
    it("should have contentSecurityPolicy defined", () => {
      expect(helmetConfiguration.contentSecurityPolicy).toBeDefined();
      expect(
        helmetConfiguration.contentSecurityPolicy?.directives
      ).toBeDefined();
    });

    it("should have correct defaultSrc directive", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.defaultSrc).toEqual(["'self'"]);
    });

    it("should have scriptSrc with nonce function", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      const scriptSrc = directives?.scriptSrc as any[];

      expect(scriptSrc).toBeDefined();
      expect(scriptSrc.length).toBeGreaterThan(0);
      expect(typeof scriptSrc[1]).toBe("function");
    });

    it("should generate nonce in scriptSrc function", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      const scriptSrc = directives?.scriptSrc as any[];
      const nonceFunc = scriptSrc[1];

      const req = {} as Request;
      const res = { locals: { scriptNonce: "test-nonce-123" } } as Response;

      const result = nonceFunc(req, res);
      expect(result).toBe("'nonce-test-nonce-123'");
    });

    it("should have correct imgSrc directive", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.imgSrc).toContain("'self'");
      expect(directives?.imgSrc).toContain("data:");
    });

    it("should have objectSrc set to none", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.objectSrc).toEqual(["'none'"]);
    });

    it("should have correct connectSrc directive", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.connectSrc).toContain("'self'");
    });

    it("should have correct formAction directive", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.formAction).toContain("'self'");
      expect(directives?.formAction).toContain("https://*.account.gov.uk");
    });

    it("should have dnsPrefetchControl disabled", () => {
      expect(helmetConfiguration.dnsPrefetchControl).toEqual({ allow: false });
    });

    it("should have frameguard set to deny", () => {
      expect(helmetConfiguration.frameguard).toEqual({ action: "deny" });
    });

    it("should have correct hsts configuration", () => {
      expect(helmetConfiguration.hsts).toEqual({
        maxAge: 31536000,
        preload: true,
        includeSubDomains: true,
      });
    });

    it("should have referrerPolicy disabled", () => {
      expect(helmetConfiguration.referrerPolicy).toBe(false);
    });

    it("should have permittedCrossDomainPolicies disabled", () => {
      expect(helmetConfiguration.permittedCrossDomainPolicies).toBe(false);
    });
  });

  describe("webchatHelmetConfiguration", () => {
    it("should have contentSecurityPolicy defined", () => {
      expect(webchatHelmetConfiguration.contentSecurityPolicy).toBeDefined();
      expect(
        webchatHelmetConfiguration.contentSecurityPolicy?.directives
      ).toBeDefined();
    });

    it("should have correct defaultSrc directive", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.defaultSrc).toEqual(["'self'"]);
    });

    it("should have styleSrc with nonce function", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      const styleSrc = directives?.styleSrc as any[];

      expect(styleSrc).toBeDefined();
      expect(typeof styleSrc[0]).toBe("function");
    });

    it("should generate nonce in styleSrc function", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      const styleSrc = directives?.styleSrc as any[];
      const nonceFunc = styleSrc[0];

      const req = {} as Request;
      const res = { locals: { scriptNonce: "test-nonce-456" } } as Response;

      const result = nonceFunc(req, res);
      expect(result).toBe("'nonce-test-nonce-456'");
    });

    it("should have scriptSrc with nonce function", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      const scriptSrc = directives?.scriptSrc as any[];

      expect(scriptSrc).toBeDefined();
      expect(typeof scriptSrc[1]).toBe("function");
    });

    it("should generate nonce in scriptSrc function", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      const scriptSrc = directives?.scriptSrc as any[];
      const nonceFunc = scriptSrc[1];

      const req = {} as Request;
      const res = { locals: { scriptNonce: "webchat-nonce" } } as Response;

      const result = nonceFunc(req, res);
      expect(result).toBe("'nonce-webchat-nonce'");
    });

    it("should have scriptSrcAttr directive", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.scriptSrcAttr).toContain("'self'");
      expect(directives?.scriptSrcAttr).toContain("'unsafe-inline'");
    });

    it("should have workerSrc directive", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.workerSrc).toEqual(["blob:"]);
    });

    it("should have mediaSrc directive", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.mediaSrc).toContain("'self'");
    });

    it("should have frameSrc directive", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.frameSrc).toContain("'self'");
      expect(directives?.frameSrc).toContain("https://*.smartagent.app");
    });

    it("should generate websocket address in connectSrc function", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      const connectSrc = directives?.connectSrc as any[];
      const wsFunc = connectSrc.find((item) => typeof item === "function");

      const req = {} as Request;
      const res = {
        locals: { missionLabWebSocketAddress: "wss://test.websocket.com" },
      } as Response;

      const result = wsFunc(req, res);
      expect(result).toBe("wss://test.websocket.com");
    });

    it("should have dnsPrefetchControl disabled", () => {
      expect(webchatHelmetConfiguration.dnsPrefetchControl).toEqual({
        allow: false,
      });
    });

    it("should have frameguard set to deny", () => {
      expect(webchatHelmetConfiguration.frameguard).toEqual({ action: "deny" });
    });

    it("should have correct hsts configuration", () => {
      expect(webchatHelmetConfiguration.hsts).toEqual({
        maxAge: 31536000,
        preload: true,
        includeSubDomains: true,
      });
    });

    it("should have referrerPolicy disabled", () => {
      expect(webchatHelmetConfiguration.referrerPolicy).toBe(false);
    });

    it("should have permittedCrossDomainPolicies disabled", () => {
      expect(webchatHelmetConfiguration.permittedCrossDomainPolicies).toBe(
        false
      );
    });
  });
});
