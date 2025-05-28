import { describe } from "mocha";
import { sinon } from "../../utils/test-utils";
import chai, { expect } from "chai";
import { Request, Response } from "express";
import sinonChai from "sinon-chai";
import {
  appendFromUrlWhenTriagePageUrl,
  buildUrlFromRequest,
  outboundContactUsLinksMiddleware,
} from "../../../src/middleware/outbound-contact-us-links-middleware";

chai.use(sinonChai);

describe("Middleware", () => {
  describe("outboundContactUsLinksMiddleware", () => {
    let req: Request;
    let res: Response;
    let next: sinon.SinonSpy;

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
          destroy: sinon.stub().callsArg(0),
        },
        log: {
          error: sinon.stub(),
          info: sinon.stub(),
        },
        get: function (headerName: string) {
          if (headerName === "Referrer") {
            return this.headers["referer"] || this.headers["referrer"];
          }
          if (headerName === "host") {
            return "home.account.gov.uk";
          }
        },
      } as any;
      res = {
        locals: {},
        status: sinon.stub().returns({
          json: sinon.stub(),
        }),
      } as any;
      next = sinon.spy();
    });

    it("should call next", () => {
      outboundContactUsLinksMiddleware(req, res, next);
      expect(req.session.destroy).to.not.have.been.called;
      expect(res.status).to.not.have.been.called;
      expect(next).to.have.been.calledOnce;
    });

    it("should set `res.locals.contactUsLinkUrl`", () => {
      expect(res.locals).to.not.have.property("contactUsLinkUrl");
      outboundContactUsLinksMiddleware(req, res, next);
      expect(res.locals).to.have.property("contactUsLinkUrl");
    });

    it("should set `res.locals.contactUsLinkUrl correct value`", () => {
      expect(res.locals).to.not.have.property("contactUsLinkUrl");
      outboundContactUsLinksMiddleware(req, res, next);
      expect(res.locals).to.have.property("contactUsLinkUrl");
      expect(res.locals.contactUsLinkUrl).to.equal(
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
      expect(builtUrl).to.equal(expectedUrl);
    });

    it("should return the decoded fromURL if present in the query", () => {
      req.originalUrl =
        "/contact-gov-uk-one-login?fromURL=https%3A%2F%2Fsignin.account.gov.uk%2Fsecurity";
      const builtUrl = buildUrlFromRequest(req);
      expect(builtUrl).to.equal("https://signin.account.gov.uk/security");
    });
  });

  describe("appendFromUrlWhenTriagePageUrl", () => {
    it("should append when there's a match", () => {
      const matchingUrl =
          "https://home.account.gov.uk/contact-gov-uk-one-login",
        fromUrl = "https://signin.account.gov.uk/enter-password";

      const result = appendFromUrlWhenTriagePageUrl(matchingUrl, fromUrl);

      expect(result).to.equal(
        `${matchingUrl}?fromURL=${encodeURIComponent(fromUrl)}`
      );
    });

    it("should not append when there isn't a match", () => {
      const nonMatchingUrl = "https://signin.account.gov.uk/contact-us",
        fromUrl = "https://signin.account.gov.uk/enter-password";

      const result = appendFromUrlWhenTriagePageUrl(nonMatchingUrl, fromUrl);

      expect(result).to.not.contain(encodeURIComponent(fromUrl));
    });
  });
});
