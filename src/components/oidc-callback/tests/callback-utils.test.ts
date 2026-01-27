import { expect } from "chai";
import sinon from "sinon";
import { describe } from "mocha";
import {
  determineRedirectUri,
  COOKIE_CONSENT,
  handleOidcCallbackError,
  populateSessionWithUserInfo,
  attachSessionIdsFromGsCookie,
  generateTokenSet,
} from "../call-back-utils";
import { PATH_DATA } from "../../../app.constants";
import * as sessionStore from "../../../utils/session-store";
import { logger } from "../../../utils/logger";
import { TokenSet } from "openid-client";

describe("callback-utils", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("generateTokenSet", () => {
    let req: any;
    let callbackStub: sinon.SinonStub;

    beforeEach(() => {
      const mockTokenSet = {
        access_token: "fake-access-token",
        id_token: "fake-id-token",
      } as TokenSet;

      callbackStub = sinon.stub().resolves(mockTokenSet);

      req = {
        oidc: {
          metadata: {
            redirect_uris: ["http://localhost/callback"],
          },
          callback: callbackStub,
        },
        session: {
          nonce: "mock-nonce",
          state: "mock-state",
        },
      } as any;
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should call oidc.callback with correct arguments and return the token set", async () => {
      const queryParams = {
        code: "fake-code",
        state: "mock-state",
      };

      const clientAssertion = "mock-client-assertion";

      const tokenSet = await generateTokenSet(
        req,
        queryParams,
        clientAssertion
      );

      expect(callbackStub.calledOnce).to.be.true;
      expect(callbackStub.firstCall.args[0]).to.equal(
        "http://localhost/callback"
      );
      expect(callbackStub.firstCall.args[1]).to.deep.equal(queryParams);
      expect(callbackStub.firstCall.args[2]).to.deep.equal({
        nonce: "mock-nonce",
        state: "mock-state",
      });
      expect(callbackStub.firstCall.args[3]).to.deep.equal({
        exchangeBody: {
          client_assertion_type:
            "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: clientAssertion,
        },
      });

      expect(tokenSet).to.have.property("access_token", "fake-access-token");
      expect(tokenSet).to.have.property("id_token", "fake-id-token");
    });

    it("should verify that the session state returned by the the oicd.callback call matches what passed in", async () => {
      const queryParams = {
        code: "fake-code",
        state: "mock-state-1",
      };

      const clientAssertion = "mock-client-assertion";

      try {
        await generateTokenSet(req, queryParams, clientAssertion);
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });

  describe("determineRedirectUri", () => {
    it("should return currentURL from session if available", () => {
      const req: any = {
        session: { currentURL: "/dashboard" },
        query: {},
      };
      const result = determineRedirectUri(req);
      expect(result).to.equal("/dashboard");
    });

    it("should return default path if currentURL not set", () => {
      const req: any = {
        session: {},
        query: {},
      };
      const result = determineRedirectUri(req);
      expect(result).to.equal(PATH_DATA.YOUR_SERVICES.url);
    });

    it("should return default path if session is null", () => {
      const req: any = {
        query: {},
      };
      const result = determineRedirectUri(req);
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
      const result = determineRedirectUri(req);
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
      const result = determineRedirectUri(req);
      expect(result).to.equal(PATH_DATA.YOUR_SERVICES.url);
    });
  });

  describe("handleOidcCallbackError", () => {
    it("clears session and redirects to SESSION_EXPIRED", async () => {
      const deleteExpressSessionStub = sinon.stub(
        sessionStore,
        "deleteExpressSession"
      );
      const loggerWarnStub = sinon.stub(logger, "warn");

      const req: any = { session: {}, oidc: {}, cookies: {} };
      const res: any = {
        locals: { trace: "trace-id" },
        redirect: sinon.fake(),
      };
      const queryParams = {
        error: "access_denied",
        error_description: "User denied access",
      };

      await handleOidcCallbackError(req, res, queryParams);

      expect(loggerWarnStub.calledOnce).to.be.true;
      expect(deleteExpressSessionStub.calledWith(req)).to.be.true;
      expect(res.redirect.calledWith(PATH_DATA.SESSION_EXPIRED.url)).to.be.true;
    });

    it("clears session and redirects to UNAVAILABLE_TEMPORARY", async () => {
      const deleteExpressSessionStub = sinon.stub(
        sessionStore,
        "deleteExpressSession"
      );
      const loggerWarnStub = sinon.stub(logger, "warn");

      const req: any = { session: {}, oidc: {}, cookies: {} };
      const res: any = {
        locals: { trace: "trace-id" },
        redirect: sinon.fake(),
      };

      const queryParams = {
        error: "temporarily_unavailable",
        error_description:
          "The authorization server is temporarily unavailable",
      };

      await handleOidcCallbackError(req, res, queryParams);

      expect(loggerWarnStub.calledOnce).to.be.true;
      expect(deleteExpressSessionStub.calledWith(req)).to.be.true;
      expect(res.redirect.calledWith(PATH_DATA.UNAVAILABLE_TEMPORARY.url)).to.be
        .true;
    });
  });

  describe("populateSessionWithUserInfo", () => {
    it("stores user info and tokens in session", () => {
      const req: any = {
        session: {},
      };
      const userInfo = {
        email: "user@example.com",
        phone_number: "1234567890",
        phone_number_verified: true,
        sub: "subject123",
        legacy_subject_id: "legacy123",
        public_subject_id: "public123",
      };

      const tokenSet = {
        id_token: "id.token",
        access_token: "access.token",
        refresh_token: "refresh.token",
      };

      populateSessionWithUserInfo(req, userInfo as any, tokenSet as any);

      expect(req.session.user.email).to.equal("user@example.com");
      expect(req.session.user.tokens.accessToken).to.equal("access.token");
      expect(req.session.user.legacySubjectId).to.equal("legacy123");
    });
  });

  describe("attachSessionIdsFromGsCookie", () => {
    it("logs warning if gs cookie is malformed", () => {
      const loggerInfo = sinon.stub(logger, "info");
      const loggerError = sinon.stub(logger, "error");

      const req: any = {
        cookies: {
          gs: "malformed-cookie",
        },
        session: {},
      };

      const res: any = {
        locals: { trace: "abc123" },
      };

      attachSessionIdsFromGsCookie(req, res);

      expect(loggerInfo.called).to.be.true;
      expect(loggerError.calledOnce).to.be.true;
      expect(req.session.authSessionIds).to.be.undefined;
    });

    it("sets session.authSessionIds when cookie is valid", () => {
      const loggerInfo = sinon.stub(logger, "info");
      const req: any = {
        cookies: {
          gs: "sess123.client456",
        },
        session: {},
      };

      const res: any = {
        locals: { trace: "trace-xyz" },
      };

      attachSessionIdsFromGsCookie(req, res);

      expect(loggerInfo.calledOnce).to.be.true;
      expect(req.session.authSessionIds).to.deep.equal({
        sessionId: "sess123",
        clientSessionId: "client456",
      });
    });

    it("logs info if gs cookie is missing", () => {
      const loggerInfo = sinon.stub(logger, "info");

      const req: any = {
        cookies: {},
        session: {},
      };
      const res: any = {
        locals: { trace: "trace-abc" },
      };

      attachSessionIdsFromGsCookie(req, res);

      expect(loggerInfo.calledOnce).to.be.true;
    });
  });
});
