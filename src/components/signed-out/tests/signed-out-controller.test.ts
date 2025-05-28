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
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("signedOutGet", () => {
    it("should return signed out page", () => {
      signedOutGet(req as Request, res as Response);

      expect(res.render).to.have.been.calledWith("signed-out/index.njk");
      expect(res.status).to.have.be.calledWith(200);
    });
  });
});
