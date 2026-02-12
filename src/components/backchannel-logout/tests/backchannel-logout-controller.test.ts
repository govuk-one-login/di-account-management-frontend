import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { HTTP_STATUS_CODES } from "../../../app.constants";
import { backchannelLogoutPost } from "../backchannel-logout-controller.js";

import {
  createLocalJWKSet,
  exportJWK,
  FlattenedJWSInput,
  generateKeyPair,
  GenerateKeyPairResult,
  JWSHeaderParameters,
  JWTPayload,
  SignJWT,
  UnsecuredJWT,
} from "jose";

import { GetKeyFunction } from "jose/dist/types/types";
import { logger } from "../../../utils/logger.js";
import * as SessionStore from "../../../utils/session-store.js";
import * as oidc from "../../../utils/oidc.js";

describe("global logout controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let issuerJWKS: GetKeyFunction<JWSHeaderParameters, FlattenedJWSInput>;
  let keySet: GenerateKeyPairResult;
  let loggerSpy: ReturnType<typeof vi.fn>;
  let destroyUserSessionsSpy: ReturnType<typeof vi.fn>;

  const validIssuer = "urn:example:issuer";
  const validAudience = "urn:example:audience";
  const validLogoutToken = {
    jti: "a-token-id",
    sid: "a-session-id",
    events: {
      "http://schemas.openid.net/event/backchannel-logout": {},
    },
  };

  function validRequest(logoutJwt: string): any {
    return {
      app: {
        locals: {
          sessionStore: {
            destroy: vi.fn(),
          },
        },
      },
      body: {
        logout_token: logoutJwt,
      },
      log: logger,
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
  }

  async function generateValidToken(token: JWTPayload, subjectId = "123456") {
    return await new SignJWT(token)
      .setIssuedAt()
      .setSubject(subjectId)
      .setIssuer(validIssuer)
      .setAudience(validAudience)
      .setProtectedHeader({ alg: "ES256" })
      .sign(keySet.privateKey);
  }

  beforeEach(async () => {
    vi.spyOn(oidc, "getOIDCClient").mockImplementation(() => {
      return Promise.resolve({});
    });

    keySet = await generateKeyPair("ES256");

    issuerJWKS = createLocalJWKSet({
      keys: [await exportJWK(keySet.publicKey)],
    });

    vi.spyOn(oidc, "getCachedJWKS").mockReturnValue(issuerJWKS);

    res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    loggerSpy = vi.spyOn(logger, "error");
    destroyUserSessionsSpy = vi.spyOn(SessionStore, "destroyUserSessions");
  });

  afterEach(async () => {
    vi.restoreAllMocks();
  });

  describe("backchannelLogoutPost", () => {
    it("should return 401 if no logout_token present", async () => {
      req = {
        body: {},
      };
      await backchannelLogoutPost(req as Request, res as Response);

      expect(res.send).toHaveBeenCalledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
    });

    it("should return 401 if logout_token not a valid JWT", async () => {
      req = {
        body: {
          logout_token: "zzzzzzzz",
        },
        log: logger,
      };
      await backchannelLogoutPost(req as Request, res as Response);

      expect(res.send).toHaveBeenCalledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(loggerSpy).toHaveBeenCalledOnce();
    });

    it("should return 401 if logout_token is present but not signed", async () => {
      const logoutJwt = new UnsecuredJWT(validLogoutToken)
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer(validIssuer)
        .setAudience(validAudience)
        .encode();

      req = validRequest(logoutJwt);

      await backchannelLogoutPost(req as Request, res as Response);

      expect(res.send).toHaveBeenCalledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(loggerSpy).toHaveBeenCalledOnce();
    });

    it("should return 401 if logout_token signed by wrong key", async () => {
      const badKeys = await generateKeyPair("ES256");

      const logoutJwt = await new SignJWT(validLogoutToken)
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer(validIssuer)
        .setAudience(validAudience)
        .setProtectedHeader({ alg: "ES256" })
        .sign(badKeys.privateKey);

      req = validRequest(logoutJwt);

      await backchannelLogoutPost(req as Request, res as Response);

      expect(res.send).toHaveBeenCalledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(loggerSpy).toHaveBeenCalledOnce();
    });

    it("should return 401 if logout_token contains invalid issuer", async () => {
      const logoutJwt = await new SignJWT(validLogoutToken)
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer("arn:bad:issuer")
        .setAudience(validAudience)
        .setProtectedHeader({ alg: "ES256" })
        .sign(keySet.privateKey);

      req = validRequest(logoutJwt);

      await backchannelLogoutPost(req as Request, res as Response);

      expect(res.send).toHaveBeenCalledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(loggerSpy).toHaveBeenCalledOnce();
    });

    it("should return 401 if logout_token contains invalid audience", async () => {
      const logoutJwt = await new SignJWT(validLogoutToken)
        .setIssuedAt()
        .setSubject("12345")
        .setIssuer(validIssuer)
        .setAudience("arn:bad:audience")
        .setProtectedHeader({ alg: "ES256" })
        .sign(keySet.privateKey);

      req = validRequest(logoutJwt);
      await backchannelLogoutPost(req as Request, res as Response);

      expect(res.send).toHaveBeenCalledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(loggerSpy).toHaveBeenCalledOnce();
    });

    it("should return 401 if logout_token is too old", async () => {
      const logoutJwt = await new SignJWT(validLogoutToken)
        .setIssuedAt(new Date().getTime() - 3600000)
        .setSubject("12345")
        .setIssuer(validIssuer)
        .setAudience(validAudience)
        .setProtectedHeader({ alg: "ES256" })
        .sign(keySet.privateKey);

      req = validRequest(logoutJwt);
      await backchannelLogoutPost(req as Request, res as Response);

      expect(res.send).toHaveBeenCalledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(loggerSpy).toHaveBeenCalledOnce();
    });

    it("should return 401 if logout_token does not contain a subject", async () => {
      const logoutJwt = await new SignJWT(validLogoutToken)
        .setIssuedAt()
        .setIssuer(validIssuer)
        .setAudience(validAudience)
        .setProtectedHeader({ alg: "ES256" })
        .sign(keySet.privateKey);

      req = validRequest(logoutJwt);
      await backchannelLogoutPost(req as Request, res as Response);

      expect(res.send).toHaveBeenCalledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(loggerSpy).toHaveBeenCalledOnce();
    });

    it("should return 401 if logout_token is blank", async () => {
      req = validRequest(await generateValidToken(validLogoutToken, " "));
      await backchannelLogoutPost(req as Request, res as Response);

      expect(res.send).toHaveBeenCalledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(loggerSpy).toHaveBeenCalledOnce();
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

      await backchannelLogoutPost(req as Request, res as Response);

      expect(res.send).toHaveBeenCalledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(loggerSpy).toHaveBeenCalledOnce();
    });

    it("should return 401 if logout_token does not any events", async () => {
      const invalidLogoutToken = {
        jti: "a-token-id",
        sid: "a-session-id",
      };

      req = validRequest(await generateValidToken(invalidLogoutToken));

      await backchannelLogoutPost(req as Request, res as Response);

      expect(res.send).toHaveBeenCalledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(loggerSpy).toHaveBeenCalledOnce();
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

      await backchannelLogoutPost(req as Request, res as Response);

      expect(res.send).toHaveBeenCalledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(loggerSpy).toHaveBeenCalledOnce();
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
      await backchannelLogoutPost(req as Request, res as Response);

      expect(res.send).toHaveBeenCalledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(loggerSpy).toHaveBeenCalledOnce();
    });

    it("should return 200 if logout_token is present and valid", async () => {
      req = validRequest(await generateValidToken(validLogoutToken));

      await backchannelLogoutPost(req as Request, res as Response);

      expect(res.send).toHaveBeenCalledWith(HTTP_STATUS_CODES.OK);
      expect(destroyUserSessionsSpy).toHaveBeenCalledWith(
        req,
        "123456",
        expect.objectContaining({ destroy: expect.any(Function) })
      );
    });
  });
});
