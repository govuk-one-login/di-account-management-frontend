import { expect } from "chai";
import { describe } from "mocha";
import { Request, Response } from "express";

import { sinon } from "../../../../test/utils/test-utils";

import { webchatGet } from "../webchat-demo-controller";

describe("Webchat demo controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      cookies: { lng: "en" },
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(),
      locals: {},
      status: sandbox.fake(),
    };

    process.env.SUPPORT_WEBCHAT_DEMO = "1";
  });

  afterEach(() => {
    sandbox.restore();
    delete process.env.SUPPORT_WEBCHAT_DEMO;
  });

  describe("contactGet", () => {
    it("should render contact centre triage page", () => {
      webchatGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("webchat-demo/index.njk");
    });
  });
});
