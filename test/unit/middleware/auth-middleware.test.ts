import { expect } from "chai";
import sinon from "sinon";
import { Request, Response } from "express";
import { Client } from "openid-client";
import { authMiddleware } from "../../../src/middleware/auth-middleware.js";
import * as oidcUtils from "../../../src/utils/oidc.js";

describe("authMiddleware", () => {
  let middleware: ReturnType<typeof authMiddleware>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: sinon.SinonSpy;
  let oidcClient: Client;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    oidcClient = {} as Client;
    sandbox = sinon.createSandbox();
    sandbox.replace(oidcUtils, "getOIDCClient", async () => oidcClient);
    req = {};
    res = {};
    next = sinon.spy();
    middleware = authMiddleware({
      client_id: "test-client-id",
      callback_url: "http://localhost/callback",
      idp_url: "http://localhost/.well-known/openid-configuration",
      scopes: ["openid", "profile", "email"],
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("registers the oidc client on the request object", async () => {
    await middleware(req as Request, res as Response, next);

    expect(req.oidc).to.equal(oidcClient);
    expect(next).to.have.been.calledOnceWithExactly();
  });

  it("does not mutate the response object", async () => {
    const snapshot = { ...res };

    await middleware(req as Request, res as Response, next);

    expect(res).to.deep.equal(snapshot);
    expect(next).to.have.been.calledOnceWithExactly();
  });

  it("thows an OIDC discovery unavailable error metric", async () => {
    const errorMessage = "OIDCDiscoveryUnavailable";
    sandbox.restore();
    sandbox.replace(oidcUtils, "getOIDCClient", async () => {
      throw new Error(errorMessage);
    });
    req.metrics = {
      addMetric: sinon.spy(),
    } as any;

    await middleware(req as Request, res as Response, next);

    expect(
      (req.metrics!.addMetric as sinon.SinonSpy).calledOnceWithExactly(
        "OIDCDiscoveryUnavailable",
        sinon.match.string,
        1
      )
    ).to.be.true;
  });
});
