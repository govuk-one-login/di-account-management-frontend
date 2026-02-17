import { describe, it, expect, vi, beforeEach } from "vitest";
// import { sinon } from "../../utils/test-utils.js";
import { Request, Response } from "express";
// import sinonChai from "sinon-chai";
import {
  appendFromUrlWhenTriagePageUrl,
  buildUrlFromRequest,
  outboundContactUsLinksMiddleware,
} from "../../../src/middleware/outbound-contact-us-links-middleware.js";

// chai.use(sinonChai);

describe("Middleware", () => {
  describe("outboundContactUsLinksMiddleware", () => {
    let req: Request;
    let res: Response;
    let next: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      req = {
        protocol: "https",
        headers: {
          host: "home.account.gov.uk",
        },
        originalUrl: "/contact-gov-uk-one-login",
        cookies: {},
        session: {
          id: "session-id",
          destroy: vi.fn().mockImplementation((...args) => args[0]()),
        },
        log: {
          error: vi.fn(),
          info: vi.fn(),
        },
        get: function (headerName: string) {
          if (headerName === "Referrer") {
            return this.headers.referer ?? this.headers.referrer;
          }
          if (headerName === "host") {
            return "home.account.gov.uk";
          }
        },
      } as any;
      res = {
        locals: {},
        status: vi.fn().mockReturnValue({
          json: vi.fn(),
        }),
      } as any;
      next = vi.fn();
    });

    it("should call next", () => {
      outboundContactUsLinksMiddleware(req, res, next);
      expect(req.session.destroy).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });

    it("should set `res.locals.contactUsLinkUrl`", () => {
      expect(res.locals).not.toHaveProperty("contactUsLinkUrl");
      outboundContactUsLinksMiddleware(req, res, next);
      expect(res.locals).toHaveProperty("contactUsLinkUrl");
    });

    it("should set `res.locals.contactUsLinkUrl correct value`", () => {
      expect(res.locals).not.toHaveProperty("contactUsLinkUrl");
      outboundContactUsLinksMiddleware(req, res, next);
      expect(res.locals).toHaveProperty("contactUsLinkUrl");
      expect(res.locals.contactUsLinkUrl).toBe(
        "https://home.account.gov.uk/contact-gov-uk-one-login?" +
          "fromURL=https%3A%2F%2Fhome.account.gov.uk%2Fcontact-gov-uk-one-login"
      );
    });
  });

  describe("buildFromUrl", () => {
    let req: Request;

    beforeEach(() => {
      req = {
        protocol: "https",
        headers: {
          host: "home.account.gov.uk",
        },
        originalUrl: "/contact-gov-uk-one-login",
        get: function (headerName: string) {
          return this.headers[headerName];
        },
      } as any;
    });

    it("should build the fromUrl as expected when fromURL is not present", () => {
      const builtUrl = buildUrlFromRequest(req),
        expectedUrl = "https://home.account.gov.uk/contact-gov-uk-one-login";
      expect(builtUrl).toBe(expectedUrl);
    });

    it("should return the decoded fromURL if present in the query", () => {
      req.originalUrl =
        "/contact-gov-uk-one-login?fromURL=https%3A%2F%2Fsignin.account.gov.uk%2Fsecurity";
      const builtUrl = buildUrlFromRequest(req);
      expect(builtUrl).toBe("https://signin.account.gov.uk/security");
    });

    it("should handle fromURL with encoded nested fromURL to return first fromURL", () => {
      req.originalUrl =
        "/contact-gov-uk-one-login?fromURL=https%3A%2F%2Fsignin.account.gov.uk%2Fsecurity%3FfromURL%3Dhttps%253A%252F%252Ffoo";
      const builtUrl = buildUrlFromRequest(req);
      expect(builtUrl).toBe(
        "https://signin.account.gov.uk/security?fromURL=https%3A%2F%2Ffoo"
      );
    });
  });

  describe("appendFromUrlWhenTriagePageUrl", () => {
    it("should append when there's a match", () => {
      const matchingUrl =
          "https://home.account.gov.uk/contact-gov-uk-one-login",
        fromUrl = "https://signin.account.gov.uk/enter-password";

      const result = appendFromUrlWhenTriagePageUrl(matchingUrl, fromUrl);

      expect(result).toBe(
        `${matchingUrl}?fromURL=${encodeURIComponent(fromUrl)}`
      );
    });

    it("should not append when there isn't a match", () => {
      const nonMatchingUrl = "https://signin.account.gov.uk/contact-us",
        fromUrl = "https://signin.account.gov.uk/enter-password";

      const result = appendFromUrlWhenTriagePageUrl(nonMatchingUrl, fromUrl);

      expect(result).not.toContain(encodeURIComponent(fromUrl));
    });
  });
});
