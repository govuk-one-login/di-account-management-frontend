import { expect } from "chai";
import sinon from "sinon";
import { Request, Response, NextFunction } from "express";
import { Client } from "openid-client";
import { authMiddleware } from "../../../src/middleware/auth-middleware";

describe("authMiddleware", () => {
  let req: Partial<Request> | any;
  let res: Partial<Response>;
  let next: NextFunction;
  let oidcClient: Client;

  beforeEach(() => {
    req = {};
    res = {};
    next = sinon.spy();
    oidcClient = {} as Client;
  });

  it("should attach oidcClient to req.oidc and call next()", async () => {
    const middleware = authMiddleware(oidcClient);

    await middleware(req as Request, res as Response, next);

    expect(req.oidc).to.equal(oidcClient);

    expect(next).to.have.been.calledOnce;
  });

  it("should not modify the response object", async () => {
    const middleware = authMiddleware(oidcClient);

    await middleware(req as Request, res as Response, next);

    expect(res).to.be.empty;

    expect(next).to.have.been.calledOnce;
  });
});
