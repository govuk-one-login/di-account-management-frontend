import { expect } from "chai";
import sinon from "sinon";
import { describe } from "mocha";
import {
  exchangeToken,
  determineRedirectUri,
  COOKIE_CONSENT,
} from "../call-back-utils";
import { PATH_DATA } from "../../../app.constants";

describe("callback-utils", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("exchangeToken", () => {
    it("should call req.oidc.callback with expected arguments", async () => {
      const fakeTokenSet = { access_token: "abc", id_token: "xyz" };

      const req: any = {
        session: { state: "test-state", nonce: "test-nonce" },
        oidc: {
          metadata: {
            client_id: "client123",
            redirect_uris: ["http://localhost/callback"],
          },
          issuer: {
            metadata: {
              token_endpoint: "http://issuer/token",
            },
          },
          callback: sinon.fake.resolves(fakeTokenSet),
        },
      };

      const service = {
        generateAssertionJwt: sinon.fake.resolves("jwt-token"),
      };

      const result = await exchangeToken(req, service as any, {
        code: "auth-code",
      });

      expect(result).to.equal(fakeTokenSet);
      expect(
        service.generateAssertionJwt.calledWith(
          "client123",
          "http://issuer/token"
        )
      ).to.be.true;
      expect(req.oidc.callback.calledOnce).to.be.true;
    });
  });

  describe("determineRedirectUri", () => {
    it("should return currentURL from session if available", () => {
      const req: any = {
        session: { currentURL: "/dashboard" },
        query: {},
      };
      const res: any = {};
      const result = determineRedirectUri(req, res);
      expect(result).to.equal("/dashboard");
    });

    it("should return default path if currentURL not set", () => {
      const req: any = {
        session: {},
        query: {},
      };
      const res: any = {};
      const result = determineRedirectUri(req, res);
      expect(result).to.equal(PATH_DATA.YOUR_SERVICES.url);
    });

    it("should append _ga param to redirect URL if consent is accepted", () => {
      const req: any = {
        session: {},
        query: {
          cookie_consent: COOKIE_CONSENT.ACCEPT,
          _ga: "GA1.2.123456",
        },
      };
      const res: any = {
        cookie: sinon.fake(),
        locals: {
          trace: "fake_trace",
          analyticsCookieDomain: "fake_analytics_domain",
        },
      };
      const result = determineRedirectUri(req, res);
      expect(result).to.equal(
        `${PATH_DATA.YOUR_SERVICES.url}?_ga=GA1.2.123456`
      );
    });

    it("should not append _ga if consent is not ACCEPT", () => {
      const req: any = {
        session: {},
        query: {
          cookie_consent: COOKIE_CONSENT.REJECT,
          _ga: "GA1.2.123456",
        },
      };
      const res: any = {
        cookie: sinon.fake(),
        locals: {
          trace: "fake_trace",
          analyticsCookieDomain: "fake_analytics_domain",
        },
      };
      const result = determineRedirectUri(req, res);
      expect(result).to.equal(PATH_DATA.YOUR_SERVICES.url);
    });
  });
});
