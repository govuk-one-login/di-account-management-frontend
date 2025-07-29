import { NextFunction, Request, Response } from "express";
import { expect, sinon } from "../../utils/test-utils";
import { describe } from "mocha";
import { setLocalVarsMiddleware } from "../../../src/middleware/set-local-vars-middleware";
import {
  ENVIRONMENT_NAME,
  PERSISTENT_SESSION_ID_UNKNOWN,
} from "../../../src/app.constants";
import * as nonceModule from "../../../src/utils/strings";

describe("set-local-vars-middleware", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      session: {} as any,
      cookies: {} as any,
      headers: {
        host: "example.com",
      },
      get: function (headerName: string) {
        if (headerName === "host") {
          return "example.com";
        }
      },
    } as Partial<Request>;
    res = {
      status: sandbox.stub(),
      locals: {},
      redirect: sandbox.fake(() => {}),
    };
    next = sandbox.fake(() => {});
  });

  afterEach(() => {
    sandbox.restore();
    delete process.env.APP_ENV;
  });

  describe("setLocalVarsMiddleware", () => {
    it("should add persistent session id to locals when cookie present", async () => {
      req.cookies = {
        "di-persistent-session-id": "psid123456xyz",
        cookies_preferences_set:
          '{"analytics":false, "gaId":"2.172053219.3232.1636392870-444224.1635165988"}',
      };

      const mockNonce = "mocked-nonce-value";
      sandbox.stub(nonceModule, "generateNonce").resolves(mockNonce);

      await setLocalVarsMiddleware(req as Request, res as Response, next);

      expect(res.locals).to.have.property("persistentSessionId");
      expect(res.locals.scriptNonce).to.equal(mockNonce);
      expect(res.locals.persistentSessionId).to.equal("psid123456xyz");
      expect(next).to.be.calledOnce;
    });

    it("should not have persistent session id on response when no cookie present", async () => {
      req.cookies = {
        cookies_preferences_set:
          '{"analytics":false, "gaId":"2.172053219.3232.1636392870-444224.1635165988"}',
      };

      await setLocalVarsMiddleware(req as Request, res as Response, next);

      expect(res.locals).to.have.property("persistentSessionId");
      expect(res.locals.persistentSessionId).to.equal(
        PERSISTENT_SESSION_ID_UNKNOWN
      );
      expect(next).to.be.calledOnce;
    });

    it("should add supportDeviceIntelligence to locals when flag is true", async () => {
      process.env.DEVICE_INTELLIGENCE_TOGGLE = "1";

      await setLocalVarsMiddleware(req as Request, res as Response, next);

      expect(res.locals).to.have.property("supportDeviceIntelligence");
      expect(res.locals.supportDeviceIntelligence).to.equal(true);
      expect(next).to.be.calledOnce;
    });

    it("should not add supportDeviceIntelligence to locals when flag is false", async () => {
      process.env.DEVICE_INTELLIGENCE_TOGGLE = "0";
      await setLocalVarsMiddleware(req as Request, res as Response, next);

      expect(res.locals).to.have.property("supportDeviceIntelligence");
      expect(res.locals.supportDeviceIntelligence).to.equal(false);
      expect(next).to.be.calledOnce;
    });

    describe("isProd", () => {
      afterEach(() => {
        delete process.env.APP_ENV;
      });

      it("should be true when the value of APP_ENV is 'production'", async () => {
        process.env.APP_ENV = ENVIRONMENT_NAME.PROD;
        await setLocalVarsMiddleware(req as Request, res as Response, next);

        expect(res.locals).to.have.property("isProd");
        expect(res.locals.isProd).to.equal(true);
        expect(next).to.be.calledOnce;
      });

      it("should be false when the value of APP_ENV is 'local'", async () => {
        process.env.APP_ENV = ENVIRONMENT_NAME.LOCAL;
        await setLocalVarsMiddleware(req as Request, res as Response, next);

        expect(res.locals).to.have.property("isProd");
        expect(res.locals.isProd).to.equal(false);
        expect(next).to.be.calledOnce;
      });

      it("should be false when the value of APP_ENV is 'development'", async () => {
        process.env.APP_ENV = ENVIRONMENT_NAME.DEV;
        await setLocalVarsMiddleware(req as Request, res as Response, next);

        expect(res.locals).to.have.property("isProd");
        expect(res.locals.isProd).to.equal(false);
        expect(next).to.be.calledOnce;
      });

      it("should be false when the value of APP_ENV is 'build'", async () => {
        process.env.APP_ENV = ENVIRONMENT_NAME.BUILD;
        await setLocalVarsMiddleware(req as Request, res as Response, next);

        expect(res.locals).to.have.property("isProd");
        expect(res.locals.isProd).to.equal(false);
        expect(next).to.be.calledOnce;
      });

      it("should be false when the value of APP_ENV is 'staging'", async () => {
        process.env.APP_ENV = ENVIRONMENT_NAME.STAGING;
        await setLocalVarsMiddleware(req as Request, res as Response, next);

        expect(res.locals).to.have.property("isProd");
        expect(res.locals.isProd).to.equal(false);
        expect(next).to.be.calledOnce;
      });

      it("should be false when the value of APP_ENV is 'integration'", async () => {
        process.env.APP_ENV = ENVIRONMENT_NAME.INTEGRATION;
        await setLocalVarsMiddleware(req as Request, res as Response, next);

        expect(res.locals).to.have.property("isProd");
        expect(res.locals.isProd).to.equal(false);
        expect(next).to.be.calledOnce;
      });
    });
  });
});
