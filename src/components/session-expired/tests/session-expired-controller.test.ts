import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils.js";
import { Request, Response } from "express";
import { sessionExpiredGet } from "../session-expired-controller.js";

describe("session expired controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {
      body: {},
      session: { user: sinon.fake() } as any,
      oidc: { authorizationUrl: sandbox.fake(), metadata: {} as any } as any,
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      locals: {},
      status: sandbox.fake(),
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("sessionExpiredGet", () => {
    it("should return session expired page", () => {
      sessionExpiredGet(req as Request, res as Response);

      expect(res.render).to.have.been.calledWith("session-expired/index.njk");
      expect(res.status).to.have.be.calledWith(401);
    });
  });
});
