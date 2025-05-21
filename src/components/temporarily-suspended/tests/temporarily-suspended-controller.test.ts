import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { temporarilySuspendedGet } from "../temporarily-suspended-controller";
import {
  RequestBuilder,
  ResponseBuilder,
} from "../../../../test/utils/builders";

describe("temporarily suspended controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = new RequestBuilder().withBody({}).build();

    res = new ResponseBuilder()
      .withRender(sandbox.fake())
      .withRedirect(sandbox.fake())
      .withStatus(sandbox.fake())
      .build();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("temporarilySuspendedGet", () => {
    it("should render the temporarily suspended view", () => {
      temporarilySuspendedGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("temporarily-suspended/index.njk");
      expect(res.status).to.have.calledWith(401);
    });
  });
});
