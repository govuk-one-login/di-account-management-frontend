import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { logoutGet } from "../logout-controller";

describe("logout controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      body: {},
      session: { user: {} },
      oidc: { endSessionUrl: sandbox.fake() },
    };
    res = { render: sandbox.fake(), redirect: sandbox.fake(), locals: {} };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("logoutGet", () => {
    it("should call redirect to end session url", () => {
      req.session.user.idToken = "";
      req.session.destroy = sandbox.fake();

      logoutGet(req as Request, res as Response);

      expect(res.redirect).to.have.called;
      expect(req.session.destroy).to.have.been.calledOnce;
      expect(req.oidc.endSessionUrl).to.have.been.calledOnce;
    });
  });
});
