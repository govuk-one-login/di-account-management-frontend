import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { oidcAuthCallbackGet } from "../call-back-controller";
import { PATH_DATA, VECTORS_OF_TRUST } from "../../../app.constants";
import { ClientAssertionServiceInterface } from "../../../utils/types";
import { logger } from "../../../utils/logger";

describe("callback controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let loggerInfoSpy: sinon.SinonSpy;
  let loggerErrorSpy: sinon.SinonSpy;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    loggerInfoSpy = sinon.spy(logger, "info");
    loggerErrorSpy = sinon.spy(logger, "error");

    req = {
      body: {},
      query: {},
      session: {
        user: {},
        destroy: sandbox.fake(),
        state: sandbox.fake(),
        nonce: sandbox.fake(),
      } as any,
      t: sandbox.fake(),
      oidc: {
        callbackParams: sandbox.fake(),
        callback: sandbox.fake.returns({
          accessToken: "accessToken",
          idToken: "idtoken",
          claims: () => {
            return { vot: VECTORS_OF_TRUST.MEDIUM };
          },
        }),
        userinfo: sandbox.fake.returns({
          email: "ad@ad.com",
          phoneNumber: "12345678999",
        }),
        metadata: { client_id: "", redirect_uris: [] },
        issuer: {
          metadata: {},
        } as any,
      } as any,
      app: {
        locals: {
          sessionStore: {
            destroy: sandbox.fake(),
          },
        },
      } as any,
    };
    res = {
      render: sandbox.fake(),
      status: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      cookie: sandbox.fake(),
      locals: {
        trace: "fake_trace",
      },
    };
  });

  afterEach(() => {
    sandbox.restore();
    loggerInfoSpy.restore();
    loggerErrorSpy.restore();
  });

  describe("oidcAuthCallbackGet", () => {
    it("should redirect to /manage-your-account", async () => {
      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: sandbox.fake.resolves("testassert"),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(PATH_DATA.YOUR_SERVICES.url);
    });

    it("should redirect to /manage-your-account and set cookie when consent query param present", async () => {
      req.query.cookie_consent = "accept";

      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: sandbox.fake.resolves("testassert"),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(res.cookie).to.have.calledOnce;
      expect(res.redirect).to.have.calledWith(PATH_DATA.YOUR_SERVICES.url);
    });

    it("should redirect to /manage-your-account and have _ga as query param when cookie consent accepted", async () => {
      req.query.cookie_consent = "accept";
      req.query._ga = "2.172053219.3232.1636392870-444224.1635165988";

      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: sandbox.fake.resolves("testassert"),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(res.cookie).to.have.calledOnce;
      expect(res.redirect).to.have.calledWith(
        PATH_DATA.YOUR_SERVICES.url +
          "?_ga=2.172053219.3232.1636392870-444224.1635165988"
      );
    });

    it("should redirect to /start when not medium level auth", async () => {
      req.oidc.callback = sandbox.fake.resolves({
        accessToken: "accessToken",
        idToken: "idtoken",
        claims: () => {
          return {
            vot: VECTORS_OF_TRUST.LOW,
            aud: "",
            exp: 123,
            iat: 456,
            iss: "iss",
            sub: "sub",
          };
        },
        expired: function (): boolean {
          throw new Error("Function not implemented.");
        },
      });
      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: sandbox.fake.resolves("testassert"),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(PATH_DATA.START.url);
    });

    it("redirect to session expired when access denied error received", async () => {
      req.oidc.callbackParams = sandbox.fake.returns({
        error: "access_denied",
        state: "m0H_2VvrhKR0qA",
      });
      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: sandbox.fake.resolves("testassert"),
      };
      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);
      expect(res.redirect).to.have.calledWith(PATH_DATA.SESSION_EXPIRED.url);
    });

    it("redirect to session expired when any error occurs", async () => {
      req.oidc.callbackParams = sandbox.fake.returns({
        error: "server_error",
        error_description: "Unexpected server error",
      });
      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: sandbox.fake.resolves("testassert"),
      };
      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);
      expect(res.redirect).to.have.calledWith(PATH_DATA.SESSION_EXPIRED.url);
    });

    it("should populate req.session.authSessionIds", async () => {
      req.cookies = {
        gs: "fake_session_id.fake_client_session_id",
      };

      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: sandbox.fake(),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(req.session.authSessionIds.sessionId).to.eq("fake_session_id");
      expect(req.session.authSessionIds.clientSessionId).to.eq(
        "fake_client_session_id"
      );
    });

    it("should not populate req.session.authSessionIds when gs cookie is malformed", async () => {
      req.cookies = {
        gs: "invalid_format",
      };

      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: sandbox.fake(),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(req.session.authSessionIds).to.eq(undefined);
      expect(loggerErrorSpy).to.have.been.calledWith(
        { trace: "fake_trace" },
        "Malformed gs cookie contained: invalid_format"
      );
    });

    it("should not populate req.session.authSessionIds when gs cookie is not set", async () => {
      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: sandbox.fake(),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(req.session.authSessionIds).to.eq(undefined);
      expect(loggerInfoSpy).to.have.been.calledWith(
        { trace: "fake_trace" },
        "gs cookie not in request."
      );
    });

    it("should redirect to session expired if session state is missing", async () => {
      req.session.state = undefined;

      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: sandbox.fake(),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(PATH_DATA.SESSION_EXPIRED.url);
    });

    it("should redirect to session expired if session nonce is missing", async () => {
      req.session.nonce = undefined;

      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: sandbox.fake(),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(PATH_DATA.SESSION_EXPIRED.url);
    });

    it("should redirect to session expired if session is missing", async () => {
      req.session = undefined;

      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: sandbox.fake(),
      };

      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(PATH_DATA.SESSION_EXPIRED.url);
    });

    it("redirect to session expired when access denied error is thrown", async () => {
      req.oidc.callbackParams = sandbox.fake.throws(new Error("access_denied"));
      const fakeService: ClientAssertionServiceInterface = {
        generateAssertionJwt: sandbox.fake.resolves("testassert"),
      };
      await oidcAuthCallbackGet(fakeService)(req as Request, res as Response);
      expect(res.redirect).to.have.calledWith(PATH_DATA.SESSION_EXPIRED.url);
    });
  });
});
