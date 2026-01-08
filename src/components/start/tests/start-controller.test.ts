import { expect } from "chai";
import { describe } from "mocha";
import { generators } from "openid-client";
import { kmsService } from "../../../../src/utils/kms";
import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { startGet } from "../start-controller";
import type { SignCommandOutput } from "@aws-sdk/client-kms";

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
    process.env.ENABLE_JAR_AUTH = "0";
  });

  afterEach(() => {
    sandbox.restore();
    delete process.env.ENABLE_JAR_AUTH;
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

    it("should redirect with new parameters when ENABLE_JAR_AUTH is true", async () => {
      process.env.ENABLE_JAR_AUTH = "1";
      const sandbox: sinon.SinonSandbox = sinon.createSandbox();
      sandbox.stub(generators, "nonce").returns("generated");
      sandbox.stub(kmsService, "sign").resolves({ Signature: [1, 2, 3] as unknown as Uint8Array, KeyId: "", SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_512", $metadata: {} }) as unknown as SignCommandOutput;
      const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
      const req: Partial<Request> = {
        body: {},
        session: { 
          user: { isAuthenticated: undefined } as any,
        } as any,
        url: "/test_url",
        query: { cookie_consent: "test" },
        oidc: {
          authorizationUrl: sandbox.spy(),
          metadata: {
            scopes: "openid",
            redirect_uris: ["url"],
            client_id: "test-client",
          },
        } as any,
      };
  
      const res: Partial<Response> = {
        render: sandbox.fake(),
        redirect: sandbox.fake(() => {}),
        locals: {},
      };

      await startGet(req as Request, res as Response);

      expect(res.redirect).to.have.called;
      expect(kmsService.sign).to.have.called;
      expect(req.oidc.authorizationUrl).to.have.been.calledOnceWith({
        client_id: 'test-client',
        response_type: 'code',
        scope: 'openid',
        request: sinon.match(jwtRegex),
      })
    });
  });
});
