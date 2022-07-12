import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { logoutGet } from "../logout-controller";

describe("logout controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: any;
  let res: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      body: {},
      session: { user: {} },
      oidc: { endSessionUrl: sandbox.fake() },
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(),
      locals: {},
      mockCookies: {},
      cookie: function (name: string, value: string) {
        this.mockCookies[name] = value;
      },
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("logoutGet", () => {
    it.only("should redirect to end session url and set cookie", () => {
      req.session.user.tokens = {
        idToken: "id-token",
      };

      req.session.destroy = sandbox.fake();

      logoutGet(req, res);

      expect(res.redirect).to.have.called;
      expect(req.session.destroy).to.have.been.calledOnce;
      expect(req.oidc.endSessionUrl).to.have.been.calledOnce;
      expect(res.mockCookies.lo).to.equal("true");
    });
  });
});
