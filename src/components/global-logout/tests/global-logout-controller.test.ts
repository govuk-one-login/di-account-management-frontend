import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { HTTP_STATUS_CODES } from "../../../app.constants";
import { globalLogoutPost } from "../global-logout-controller";
import {
  FlattenedJWSInput,
  GetKeyFunction,
  JWSHeaderParameters,
} from "jose/dist/types/types";
import { GenerateKeyPairResult } from "jose";
import { GlobalLogoutServiceInterface, LogoutToken } from "../types";

const jose = require("jose");

describe("global logout controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let issuerJWKS: GetKeyFunction<JWSHeaderParameters, FlattenedJWSInput>;
  let keySet: GenerateKeyPairResult;
  let fakeService: GlobalLogoutServiceInterface;

  const validIssuer = "urn:example:issuer";
  const validAudience = "urn:example:audience";
  const validLogoutToken = {
    jti: "a-token-id",
    sid: "a-session-id",
    events: {
      "http://schemas.openid.net/event/backchannel-logout": {},
    },
  };

  const validRequest = (logoutJwt: LogoutToken) => {
    return {
      body: {
        logout_token: logoutJwt,
      },
      log: { error: sandbox.fake() },
      issuerJWKS: issuerJWKS,
      oidc: {
        issuer: {
          metadata: {
            issuer: validIssuer,
          },
        },
        metadata: {
          client_id: validAudience,
        },
      },
    };
  };

  const generateValidToken = async (token: any, subjectId = "123456") => {
    return await new jose.SignJWT(token)
      .setIssuedAt()
      .setSubject(subjectId)
      .setIssuer(validIssuer)
      .setAudience(validAudience)
      .setProtectedHeader({ alg: "ES256" })
      .sign(keySet.privateKey);
  };

  beforeEach(async () => {
    sandbox = sinon.createSandbox();

    const oidc = require("../../../utils/oidc");
    sandbox.stub(oidc, "getOIDCClient").callsFake(() => {
      return new Promise((resolve) => {
        resolve({});
      });
    });

    keySet = await jose.generateKeyPair("ES256");

    issuerJWKS = await jose.createLocalJWKSet({
      keys: [await jose.exportJWK(keySet.publicKey)],
    });

    res = {
      status: sandbox.stub().returnsThis(),
      send: sandbox.fake(),
    };

    fakeService = {
      clearSessionForSubject: sandbox.fake(),
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
      await globalLogoutPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(
        HTTP_STATUS_CODES.UNAUTHORIZED
      );
    });

    it("should return 401 if logout_token not a valid JWT", async () => {
      req = {
        body: {
          logout_token: "zzzzzzzz",
        },
        log: { error: sandbox.fake() },
      };
      await globalLogoutPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(
        HTTP_STATUS_CODES.UNAUTHORIZED
      );
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token is present but not signed", async () => {
      const logoutJwt = new jose.UnsecuredJWT(validLogoutToken)
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer(validIssuer)
        .setAudience(validAudience)
        .encode();

      req = validRequest(logoutJwt);

      await globalLogoutPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(
        HTTP_STATUS_CODES.UNAUTHORIZED
      );
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token signed by wrong key", async () => {
      const badKeys = await jose.generateKeyPair("ES256");

      const logoutJwt = await new jose.SignJWT(validLogoutToken)
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer(validIssuer)
        .setAudience(validAudience)
        .setProtectedHeader({ alg: "ES256" })
        .sign(badKeys.privateKey);

      req = validRequest(logoutJwt);

      await globalLogoutPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(
        HTTP_STATUS_CODES.UNAUTHORIZED
      );
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token contains invalid issuer", async () => {
      const logoutJwt = await new jose.SignJWT(validLogoutToken)
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer("arn:bad:issuer")
        .setAudience(validAudience)
        .setProtectedHeader({ alg: "ES256" })
        .sign(keySet.privateKey);

      req = validRequest(logoutJwt);

      await globalLogoutPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(
        HTTP_STATUS_CODES.UNAUTHORIZED
      );
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token contains invalid audience", async () => {
      const logoutJwt = await new jose.SignJWT(validLogoutToken)
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer(validIssuer)
        .setAudience("arn:bad:audience")
        .setProtectedHeader({ alg: "ES256" })
        .sign(keySet.privateKey);

      req = validRequest(logoutJwt);
      await globalLogoutPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(
        HTTP_STATUS_CODES.UNAUTHORIZED
      );
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token is too old", async () => {
      const logoutJwt = await new jose.SignJWT(validLogoutToken)
        .setIssuedAt(new Date().getTime() - 3600000)
        .setSubject("12345")
        .setIssuer(validIssuer)
        .setAudience(validAudience)
        .setProtectedHeader({ alg: "ES256" })
        .sign(keySet.privateKey);

      req = validRequest(logoutJwt);
      await globalLogoutPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(
        HTTP_STATUS_CODES.UNAUTHORIZED
      );
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token does not contain a subject", async () => {
      const logoutJwt = await new jose.SignJWT(validLogoutToken)
        .setIssuedAt()
        .setIssuer(validIssuer)
        .setAudience(validAudience)
        .setProtectedHeader({ alg: "ES256" })
        .sign(keySet.privateKey);

      req = validRequest(logoutJwt);
      await globalLogoutPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(
        HTTP_STATUS_CODES.UNAUTHORIZED
      );
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token is blank", async () => {
      req = validRequest(await generateValidToken(validLogoutToken, " "));
      await globalLogoutPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(
        HTTP_STATUS_CODES.UNAUTHORIZED
      );
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token does not contain correct event", async () => {
      const invalidLogoutToken = {
        jti: "a-token-id",
        sid: "a-session-id",
        events: {
          "not-a-valid-event": {},
        },
      };

      req = validRequest(await generateValidToken(invalidLogoutToken));

      await globalLogoutPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(
        HTTP_STATUS_CODES.UNAUTHORIZED
      );
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token does not any events", async () => {
      const invalidLogoutToken = {
        jti: "a-token-id",
        sid: "a-session-id",
      };

      req = validRequest(await generateValidToken(invalidLogoutToken));

      await globalLogoutPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(
        HTTP_STATUS_CODES.UNAUTHORIZED
      );
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token contains invalid event", async () => {
      const invalidLogoutToken = {
        jti: "a-token-id",
        sid: "a-session-id",
        events: {
          "bad-event": {},
        },
      };

      req = validRequest(await generateValidToken(invalidLogoutToken));

      await globalLogoutPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(
        HTTP_STATUS_CODES.UNAUTHORIZED
      );
      expect(req.log.error).to.have.been.called;
    });

    it("should return 401 if logout_token contains valid but non-empty event", async () => {
      const invalidLogoutToken = {
        jti: "a-token-id",
        sid: "a-session-id",
        events: {
          "http://schemas.openid.net/event/backchannel-logout": {
            an: "invalid-value",
          },
        },
      };

      req = validRequest(await generateValidToken(invalidLogoutToken));
      await globalLogoutPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(
        HTTP_STATUS_CODES.UNAUTHORIZED
      );
      expect(req.log.error).to.have.been.called;
    });

    it("should return 200 if logout_token is present and valid", async () => {
      req = validRequest(await generateValidToken(validLogoutToken));

      await globalLogoutPost(fakeService)(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.OK);
    });
  });
});
