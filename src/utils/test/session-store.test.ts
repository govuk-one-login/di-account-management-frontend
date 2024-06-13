import { Request, Response } from "express";
import { describe } from "mocha";
import sinon from "sinon";
import { clearCookies } from "../session-store.js";
import { expect } from "chai";

describe("Session Store Util Tests", () => {
  describe("Clear cookies", () => {
    let sandbox: sinon.SinonSandbox;
    let req: Partial<Request>;
    let res: any;

    beforeEach(() => {
      sandbox = sinon.createSandbox();

      req = {
        body: {},
        cookies: {
          _csrf: "dasdasdas",
          lo: "false",
          lng: "en",
          am: "dsadasdasd",
        },
        session: { user: { state: {} }, destroy: sandbox.fake() } as any,
        t: sandbox.fake.returns("translated-string"),
      };
      res = {
        render: sandbox.fake(),
        redirect: sandbox.fake(() => {}),
        locals: {},
        clearCookie: sandbox.fake(() => {}),
      };
    });

    afterEach(() => {
      sandbox.restore();
    });

    it("clear cookie where matching single cookies exist", () => {
      clearCookies(req as Request, res as Response, ["am"]);
      expect(res.clearCookie.calledOnce).to.be.true;
      expect(res.clearCookie.calledWith("am")).to.be.true;
    });

    it("clear cookie where matching multiple cookies exist", () => {
      clearCookies(req as Request, res as Response, ["am", "lng"]);
      expect(res.clearCookie.calledTwice).to.be.true;
      expect(res.clearCookie.calledWith("am")).to.be.true;
      expect(res.clearCookie.calledWith("lng")).to.be.true;
    });

    it("should not clear cookie where no matching cookies exist", () => {
      clearCookies(req as Request, res as Response, ["another"]);
      expect(res.clearCookie.notCalled).to.be.true;
    });

    it("should not fail if cookie names is null", () => {
      let errorOccurred = false;
      try {
        clearCookies(req as Request, res as Response, null);
      } catch (error) {
        errorOccurred = true;
      }
      expect(errorOccurred).to.be.false;
    });
  });
});
