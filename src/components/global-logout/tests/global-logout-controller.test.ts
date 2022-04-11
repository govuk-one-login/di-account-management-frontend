import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { HTTP_STATUS_CODES } from "../../../app.constants";
import { globalLogoutPost } from "../global-logout-controller";
import { FlattenedJWSInput, GetKeyFunction, JWSHeaderParameters, KeyLike } from "jose/dist/types/types";
import { GenerateKeyPairResult } from "jose";

const jose = require('jose')

describe("global logout controller",  () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let issuerJWKS: GetKeyFunction<JWSHeaderParameters, FlattenedJWSInput>;
  let keySet: GenerateKeyPairResult;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();

    const oidc = require("../../../utils/oidc");
    sandbox.stub(oidc, "getOIDCClient").callsFake(() => {
      return new Promise((resolve) => {
        resolve({
        });
      });
    });

    keySet = await jose.generateKeyPair('ES256');

    issuerJWKS = await jose.createLocalJWKSet({
      keys: [
        await jose.exportJWK(keySet.publicKey)
      ]});

    res = {
      status: sandbox.stub().returnsThis(),
      send: sandbox.fake(),
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  describe("globalLogoutPost", async () => {
    it("should return 401 if no logout_token present", async () => {
      req = {
        body: {},
      };
      await globalLogoutPost(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
    });

    it("should return 401 if no logout_token not a signed JWT", async () => {
      req = {
        body: {
          logout_token: "zzzzzzzz"
        },
        log: { error: sandbox.fake() }
      };
      await globalLogoutPost(req as Request, res as Response)

      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token is present but invalid", async () => {
      const logout_token = {
        "jti": "",
        "sid": "",
        "events": {
          "http://schemas.openid.net/event/backchannel-logout": {}
        }
      };

      const logout_jwt = new jose.UnsecuredJWT(logout_token)
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer("urn:example:issuer")
        .setAudience("urn:example:audience")
        .encode();

      req = {
        body: {
          logout_token: logout_jwt,
        },
        log: { error: sandbox.fake() },
        issuerJWKS: issuerJWKS,
      };
      await globalLogoutPost(req as Request, res as Response)

      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if no logout_token signed by wrong key", async () => {
      const badKeys = await jose.generateKeyPair('ES256');
      const logout_token = {
        "jti": "a-token-id",
        "sid": "a-session-id",
        "events": {
          "http://schemas.openid.net/event/backchannel-logout": {}
        }
      };

      const logout_jwt = await new jose.SignJWT(logout_token)
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer("urn:example:issuer")
        .setAudience("urn:example:audience")
        .setProtectedHeader({ alg: 'ES256' })
        .sign(badKeys.privateKey);

      req = {
        body: {
          logout_token: logout_jwt
        },
        log: { error: sandbox.fake() },
        issuerJWKS: issuerJWKS,
      };
      await globalLogoutPost(req as Request, res as Response)

      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });

    it("should return 200 if logout_token is present and valid", async () => {
      const logout_token = {
        "jti": "a-token-id",
        "sid": "a-session-id",
        "events": {
          "http://schemas.openid.net/event/backchannel-logout": {}
        }
      };

      const logout_jwt = await new jose.SignJWT(logout_token)
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer("urn:example:issuer")
        .setAudience("urn:example:audience")
        .setProtectedHeader({ alg: 'ES256' })
        .sign(keySet.privateKey);

      req = {
        body: {
          logout_token: logout_jwt,
        },
        log: { error: sandbox.fake() },
        issuerJWKS: issuerJWKS,
      };
      await globalLogoutPost(req as Request, res as Response)

      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.OK);
    });

  });
});
