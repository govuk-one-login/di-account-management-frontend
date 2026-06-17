import { describe, it, expect } from "vitest";
import {
  helmetConfiguration,
  webchatHelmetConfiguration,
} from "../../../src/config/helmet.js";
import { Request, Response } from "express";

function getNonceFunction(
  entries: any[]
): (req: Request, res: Response) => string {
  return entries.find((item) => typeof item === "function");
}

describe("helmet config", () => {
  describe("helmetConfiguration", () => {
    it("should have contentSecurityPolicy defined", () => {
      expect(helmetConfiguration.contentSecurityPolicy).toBeDefined();
      expect(
        helmetConfiguration.contentSecurityPolicy?.directives
      ).toBeDefined();
    });

    it("should only have expected directives", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(Object.keys(directives!).sort()).toEqual([
        "connectSrc",
        "defaultSrc",
        "formAction",
        "imgSrc",
        "objectSrc",
        "scriptSrc",
      ]);
    });

    it("should have correct defaultSrc directive", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.defaultSrc).toEqual(["'self'"]);
    });

    it("should have correct scriptSrc directive", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      const scriptSrc = directives?.scriptSrc as any[];

      expect(scriptSrc).toHaveLength(8);
      expect(scriptSrc).toContain("'self'");
      expect(scriptSrc).toContain(
        "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='" // pragma: allowlist secret
      );
      expect(scriptSrc).toContain("https://*.googletagmanager.com");
      expect(scriptSrc).toContain("https://*.google-analytics.com");
      expect(scriptSrc).toContain("https://*.analytics.google.com");
      expect(scriptSrc).toContain("https://*.ruxit.com");
      expect(scriptSrc).toContain("https://*.dynatrace.com");
      expect(getNonceFunction(scriptSrc)).toBeDefined();
    });

    it("should generate nonce in scriptSrc function", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      const scriptSrc = directives?.scriptSrc as any[];
      const nonceFunc = getNonceFunction(scriptSrc);

      const req = {} as Request;
      const res = { locals: { scriptNonce: "test-nonce-123" } } as Response;

      expect(nonceFunc(req, res)).toBe("'nonce-test-nonce-123'");
    });

    it("should have correct imgSrc directive", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.imgSrc).toHaveLength(6);
      expect(directives?.imgSrc).toContain("'self'");
      expect(directives?.imgSrc).toContain("data:");
      expect(directives?.imgSrc).toContain("https://*.googletagmanager.com");
      expect(directives?.imgSrc).toContain("https://*.google-analytics.com");
      expect(directives?.imgSrc).toContain("https://*.analytics.google.com");
      expect(directives?.imgSrc).toContain("https://*.g.doubleclick.net");
    });

    it("should have objectSrc set to none", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.objectSrc).toEqual(["'none'"]);
    });

    it("should have correct connectSrc directive", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.connectSrc).toHaveLength(6);
      expect(directives?.connectSrc).toContain("'self'");
      expect(directives?.connectSrc).toContain(
        "https://*.google-analytics.com"
      );
      expect(directives?.connectSrc).toContain(
        "https://*.analytics.google.com"
      );
      expect(directives?.connectSrc).toContain("https://*.g.doubleclick.net");
      expect(directives?.connectSrc).toContain("https://*.ruxit.com");
      expect(directives?.connectSrc).toContain("https://*.dynatrace.com");
    });

    it("should have correct formAction directive", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.formAction).toHaveLength(2);
      expect(directives?.formAction).toContain("'self'");
      expect(directives?.formAction).toContain("https://*.account.gov.uk");
    });

    it("should not have styleSrc directive", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.styleSrc).toBeUndefined();
    });

    it("should not have scriptSrcAttr directive", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.scriptSrcAttr).toBeUndefined();
    });

    it("should not have workerSrc directive", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.workerSrc).toBeUndefined();
    });

    it("should not have mediaSrc directive", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.mediaSrc).toBeUndefined();
    });

    it("should not have frameSrc directive", () => {
      const directives = helmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.frameSrc).toBeUndefined();
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

    it("should only have expected directives", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      expect(Object.keys(directives!).sort()).toEqual([
        "connectSrc",
        "defaultSrc",
        "formAction",
        "frameSrc",
        "imgSrc",
        "mediaSrc",
        "objectSrc",
        "scriptSrc",
        "scriptSrcAttr",
        "styleSrc",
        "workerSrc",
      ]);
    });

    it("should have correct defaultSrc directive", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.defaultSrc).toEqual(["'self'"]);
    });

    it("should have correct styleSrc directive", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      const styleSrc = directives?.styleSrc as any[];

      expect(styleSrc).toHaveLength(4);
      expect(styleSrc).toContain("'self'");
      expect(styleSrc).toContain("https://*.smartagent.app");
      expect(styleSrc).toContain("https://fonts.cdnfonts.com");
      expect(getNonceFunction(styleSrc)).toBeDefined();
    });

    it("should generate nonce in styleSrc function", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      const styleSrc = directives?.styleSrc as any[];
      const nonceFunc = getNonceFunction(styleSrc);

      const req = {} as Request;
      const res = { locals: { scriptNonce: "test-nonce-456" } } as Response;

      expect(nonceFunc(req, res)).toBe("'nonce-test-nonce-456'");
    });

    it("should have correct scriptSrc directive", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      const scriptSrc = directives?.scriptSrc as any[];

      expect(scriptSrc).toHaveLength(11);
      expect(scriptSrc).toContain("'self'");
      expect(scriptSrc).toContain(
        "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='" // pragma: allowlist secret
      );
      expect(scriptSrc).toContain("https://*.googletagmanager.com");
      expect(scriptSrc).toContain("https://*.google-analytics.com");
      expect(scriptSrc).toContain("https://*.analytics.google.com");
      expect(scriptSrc).toContain("https://*.g.doubleclick.net");
      expect(scriptSrc).toContain("https://*.smartagent.app");
      expect(scriptSrc).toContain("https://*.ruxit.com");
      expect(scriptSrc).toContain("https://*.dynatrace.com");
      expect(scriptSrc).toContain("'strict-dynamic'");
      expect(getNonceFunction(scriptSrc)).toBeDefined();
    });

    it("should generate nonce in scriptSrc function", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      const scriptSrc = directives?.scriptSrc as any[];
      const nonceFunc = getNonceFunction(scriptSrc);

      const req = {} as Request;
      const res = { locals: { scriptNonce: "webchat-nonce" } } as Response;

      expect(nonceFunc(req, res)).toBe("'nonce-webchat-nonce'");
    });

    it("should have correct scriptSrcAttr directive", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.scriptSrcAttr).toHaveLength(2);
      expect(directives?.scriptSrcAttr).toContain("'self'");
      expect(directives?.scriptSrcAttr).toContain("'unsafe-inline'");
    });

    it("should have correct imgSrc directive", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.imgSrc).toHaveLength(7);
      expect(directives?.imgSrc).toContain("'self'");
      expect(directives?.imgSrc).toContain("data:");
      expect(directives?.imgSrc).toContain("https://*.googletagmanager.com");
      expect(directives?.imgSrc).toContain("https://*.google-analytics.com");
      expect(directives?.imgSrc).toContain("https://*.analytics.google.com");
      expect(directives?.imgSrc).toContain("https://*.g.doubleclick.net");
      expect(directives?.imgSrc).toContain(
        "https://*.s3.eu-west-2.amazonaws.com"
      );
    });

    it("should have objectSrc set to none", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.objectSrc).toEqual(["'none'"]);
    });

    it("should have correct connectSrc directive", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      const connectSrc = directives?.connectSrc as any[];

      expect(connectSrc).toHaveLength(11);
      expect(connectSrc).toContain("'self'");
      expect(connectSrc).toContain("https://*.google-analytics.com");
      expect(connectSrc).toContain("https://*.analytics.google.com");
      expect(connectSrc).toContain("https://*.g.doubleclick.net");
      expect(connectSrc).toContain("https://*.smartagent.app");
      expect(connectSrc).toContain("https://*.ruxit.com");
      expect(connectSrc).toContain("https://*.dynatrace.com");
      expect(connectSrc).toContain(
        "https://participant.connect.eu-west-2.amazonaws.com"
      );
      expect(connectSrc).toContain(
        "wss://*.transport.connect.eu-west-2.amazonaws.com"
      );
      expect(connectSrc).toContain(" https://api.rollbar.com");
      expect(getNonceFunction(connectSrc)).toBeDefined();
    });

    it("should generate websocket address in connectSrc function", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      const connectSrc = directives?.connectSrc as any[];
      const wsFunc = getNonceFunction(connectSrc);

      const req = {} as Request;
      const res = {
        locals: { missionLabWebSocketAddress: "wss://test.websocket.com" },
      } as Response;

      expect(wsFunc(req, res)).toBe("wss://test.websocket.com");
    });

    it("should have correct workerSrc directive", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.workerSrc).toEqual(["blob:"]);
    });

    it("should have correct formAction directive", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.formAction).toHaveLength(2);
      expect(directives?.formAction).toContain("'self'");
      expect(directives?.formAction).toContain("https://*.account.gov.uk");
    });

    it("should have correct mediaSrc directive", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.mediaSrc).toHaveLength(2);
      expect(directives?.mediaSrc).toContain("'self'");
      expect(directives?.mediaSrc).toContain(
        "https://*.s3.eu-west-2.amazonaws.com"
      );
    });

    it("should have correct frameSrc directive", () => {
      const directives =
        webchatHelmetConfiguration.contentSecurityPolicy?.directives;
      expect(directives?.frameSrc).toHaveLength(2);
      expect(directives?.frameSrc).toContain("'self'");
      expect(directives?.frameSrc).toContain("https://*.smartagent.app");
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
