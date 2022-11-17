import { NextFunction, Request, Response } from "express";
import { expect, sinon } from "../../utils/test-utils";
import { describe } from "mocha";
import { setLocalVarsMiddleware } from "../../../src/middleware/set-local-vars-middleware";

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
    };
    res = { status: sandbox.stub(), locals: {}, redirect: sandbox.fake() };
    next = sandbox.fake();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("setLocalVarsMiddleware", () => {
    it("should add persistent session id to locals when cookie present", () => {
      req.cookies = {
        "di-persistent-session-id": "psid123456xyz",
        cookies_preferences_set:
          '{"analytics":false, "gaId":"2.172053219.3232.1636392870-444224.1635165988"}',
      };
      setLocalVarsMiddleware(req as Request, res as Response, next);

      expect(res.locals).to.have.property("persistentSessionId");
      expect(res.locals.persistentSessionId).to.equal("psid123456xyz");
      expect(next).to.be.calledOnce;
    });
    it("should not have persistent session id on response when no cookie present", () => {
      req.cookies = {
        cookies_preferences_set:
          '{"analytics":false, "gaId":"2.172053219.3232.1636392870-444224.1635165988"}',
      };

      setLocalVarsMiddleware(req as Request, res as Response, next);

      expect(res.locals).to.not.have.property("persistentSessionId");
      expect(next).to.be.calledOnce;
    });

    describe("supportNewAccountHeader feature flag", () => {
      afterEach(() => {
        delete process.env.SUPPORT_NEW_ACCOUNT_HEADER;
      })

      it("should set a supportNewAccountHeader to locale from the environment", () => {
        process.env.SUPPORT_NEW_ACCOUNT_HEADER = "1"
        setLocalVarsMiddleware(req as Request, res as Response, next);
        expect(res.locals).to.have.property("supportNewAccountHeader");
        expect(res.locals.supportNewAccountHeader).to.equal(true);
      })

      it("should have a false supportNewAccountHeader when SUPPORT_NEW_ACCOUNT_HEADER is 0", () => {
        process.env.SUPPORT_NEW_ACCOUNT_HEADER = "0"
        setLocalVarsMiddleware(req as Request, res as Response, next);
        expect(res.locals).to.have.property("supportNewAccountHeader");
        expect(res.locals.supportNewAccountHeader).to.equal(false);
      });
    });
  });
});
