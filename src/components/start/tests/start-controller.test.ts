import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { startGet } from "../start-controller";

describe("start controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      body: {},
      query: {},
      session: { user: sinon.fake() } as any,
      oidc: { authorizationUrl: sandbox.fake(), metadata: {} as any } as any,
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      locals: {},
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("startGet", () => {
    it("should redirect to authorisation server", async () => {
      req.oidc.metadata.scopes = "openid";
      req.oidc.metadata.redirect_uris = ["url"];
      req.oidc.metadata.client_id = "test-client";

      await startGet(req as Request, res as Response);

      expect(res.redirect).to.have.called;
      expect(req.oidc.authorizationUrl).to.have.been.calledOnce;
    });
  });
});
