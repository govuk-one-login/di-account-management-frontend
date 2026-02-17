import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generators } from "openid-client";
import { kmsService } from "../../../../src/utils/kms";
import { Request, Response } from "express";
import { startGet } from "../start-controller.js";
import type { SignCommandOutput } from "@aws-sdk/client-kms";

describe("start controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      session: { user: vi.fn() } as any,
      oidc: { authorizationUrl: vi.fn(), metadata: {} as any } as any,
    };
    res = {
      render: vi.fn(),
      redirect: vi.fn(() => {}),
      locals: {},
    };
    // Suppress unused variable warnings - these are set up for potential future tests
    void req;
    void res;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("startGet", () => {
    it("should redirect to the authorisation server", async () => {
      vi.spyOn(generators, "nonce").mockReturnValue("generated");
      vi.spyOn(kmsService, "sign").mockResolvedValue({
        Signature: new Uint8Array([1, 2, 3]),
        KeyId: "",
        SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_512",
        $metadata: {},
      }) as unknown as SignCommandOutput;
      const req: Partial<Request> = {
        body: {},
        session: {
          user: { isAuthenticated: undefined } as any,
        } as any,
        url: "/test_url",
        query: { cookie_consent: "test" },
        oidc: {
          authorizationUrl: vi.fn(),
          metadata: {
            scopes: "openid",
            redirect_uris: ["url"],
            client_id: "test-client",
          },
        } as any,
      };

      const res: Partial<Response> = {
        render: vi.fn(),
        redirect: vi.fn(() => {}),
        locals: {},
      };

      await startGet(req as Request, res as Response);

      expect(res.redirect).toHaveBeenCalled();
      expect(kmsService.sign).toHaveBeenCalled();
      expect(req.oidc.authorizationUrl).toHaveBeenCalledOnce();
      const callArgs = (req.oidc.authorizationUrl as any).mock.calls[0][0];
      expect(callArgs).toMatchObject({
        client_id: "test-client",
        response_type: "code",
        scope: "openid",
      });
      expect(callArgs.request).toBeDefined();
      expect(typeof callArgs.request).toBe("string");
    });
  });
});
