import { expect } from "chai";
import { describe } from "mocha";
import { searchServicesGet } from "../search-services-controller";
import { Request, Response } from "express";
import { sinon } from "../../../../test/utils/test-utils";

import * as services from "../../../utils/yourServices";
import * as config from "../../../config";

describe("search services controller", () => {
  let res: Partial<Response>;
  let req: Partial<Request>;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {};
    res = {
      render: sandbox.fake(),
    };

    sandbox.stub(services, "getSearchableClientsList").returns(["a", "b"]);
    sandbox.stub(config, "getAppEnv").returns("test");
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should return a hello world message", () => {
    searchServicesGet(req as Request, res as Response);
    expect(res.render).to.have.calledWith("search-services/index.njk", {
      env: "test",
      services: ["a", "b"],
    });
  });
});
