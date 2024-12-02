import { expect } from "chai";
import { describe } from "mocha";
import { searchServicesGet } from "../search-services-controller";
import { Request, Response } from "express";
import { sinon } from "../../../../test/utils/test-utils";

describe("search services controller", () => {
  let res: Partial<Response>;
  let req: Partial<Request>;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = {};
    res = {
      send: sandbox.fake(),
    };
  });

  it.only("should return a hello world message", () => {
    searchServicesGet(req as Request, res as Response);
    expect(res.send).to.have.calledWith("hello world");
  });
});
