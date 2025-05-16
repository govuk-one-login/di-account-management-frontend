import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { signedOutGet } from "../signed-out-controller";

describe("signed out controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      body: {},
    };
    res = {
      render: sandbox.fake(),
      status: sandbox.fake(),
      redirect: sandbox.fake(),
    } as any;
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("signedOutGet", () => {
    it("should return signed out page when no post_logout_redirect_uri", () => {
      signedOutGet(req as Request, res as Response);

      expect(res.render).to.have.been.calledWith("signed-out/index.njk");
      expect(res.status).to.have.been.calledWith(401);
      expect(res.redirect).to.not.have.been.called;
    });

    it("should redirect if post_logout_redirect_uri is present as string", () => {
      req.query = {
        post_logout_redirect_uri: "http://example.com/unavailable-temporary",
      };

      signedOutGet(req as Request, res as Response);

      expect(res.redirect).to.have.been.calledWith(
        "http://example.com/unavailable-temporary"
      );
      expect(res.render).to.not.have.been.called;
      expect(res.status).to.have.been.calledWith(401);
    });

    it("should return signed out page if post_logout_redirect_uri is not a string", () => {
      req.query = { post_logout_redirect_uri: 12345 as any };

      signedOutGet(req as Request, res as Response);

      expect(res.render).to.have.been.calledWith("signed-out/index.njk");
      expect(res.status).to.have.been.calledWith(401);
      expect(res.redirect).to.not.have.been.called;
    });

    it("should return signed out page if query is undefined", () => {
      req.query = undefined;

      signedOutGet(req as Request, res as Response);

      expect(res.render).to.have.been.calledWith("signed-out/index.njk");
      expect(res.status).to.have.been.calledWith(401);
      expect(res.redirect).to.not.have.been.called;
    });
  });
});
