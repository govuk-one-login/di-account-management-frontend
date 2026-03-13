import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isValidTokenResponse,
  validateQueryParams,
  exchangeCodeForToken,
  getJourneyOutcomeResponse,
  handleJourneyOutcomeResponse,
} from "../amc-callback-utils";
import { http } from "../../../utils/http.js";
import { kmsService } from "../../../utils/kms.js";
import { SignCommandOutput } from "@aws-sdk/client-kms";
import { GetPublicKeyCommandOutput } from "@aws-sdk/client-kms";
import * as config from "../../../config.js";
import { LogoutState } from "../../../app.constants.js";
import { handleLogout } from "../../../utils/logout.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

vi.mock("../../../utils/http.js", () => ({
  http: { client: { post: vi.fn(), get: vi.fn() } },
  getRequestConfig: vi.fn(),
}));

vi.mock("../../../utils/kms.js", () => ({
  kmsService: {
    getPublicKey: vi.fn(),
    sign: vi.fn(),
  },
}));

vi.mock("../../../utils/logout.js", () => ({
  handleLogout: vi.fn(),
}));

describe("AMC call back util tests", () => {
  vi.spyOn(config, "getAmcTokenUrl").mockReturnValue("https://test.com");
  vi.spyOn(config, "getAmcClientId").mockReturnValue("test-client");
  vi.spyOn(config, "getHomeBaseUrl").mockReturnValue("https://app.com");
  vi.spyOn(config, "getAmcJourneyOutcomeUrl").mockReturnValue(
    "https://journey-outcome.co.uk"
  );

  const mockPublicKey: Partial<GetPublicKeyCommandOutput> = {
    KeyId:
      "arn:aws:kms:eu-west-2:123456789012:key/1234abcd-12ab-34cd-56ef-1234567890ab",
    PublicKey: Buffer.from("test-public-key"),
  };
  describe("isValidTokenResponse", () => {
    it("should return true for a valid response object", () => {
      const valid = {
        access_token: "at",
        token_type: "Bearer",
        expires_in: 3600,
      };
      expect(isValidTokenResponse(valid as any)).toBe(true);
    });

    it("should return false if fields are missing or wrong type", () => {
      expect(isValidTokenResponse({ access_token: "at" } as any)).toBe(false);
      expect(
        isValidTokenResponse({
          access_token: "at",
          token_type: "NotBearer",
          expires_in: 3600,
        } as any)
      ).toBe(false);
    });
  });

  describe("validateQueryParams", () => {
    it("should throw if 'state' not provided", () => {
      expect(() => validateQueryParams({ code: "123" }, "test")).toThrow(
        "Invalid request: Must provide 'state'"
      );
    });

    it("should throw if 'state' not equal to user state", () => {
      expect(() =>
        validateQueryParams({ state: "foo", code: "123" }, "test")
      ).toThrow(
        "Invalid request: 'state' parameter and user session state are different"
      );
    });

    it("should allow 'code' only", () => {
      expect(() =>
        validateQueryParams({ state: "foo", code: "123" }, "foo")
      ).not.toThrow();
    });

    it("should allow 'error' and 'error_description' together", () => {
      expect(() =>
        validateQueryParams(
          {
            state: "foo",
            error: "denied",
            error_description: "user cancelled",
          },
          "foo"
        )
      ).not.toThrow();
    });

    it("should throw if neither code nor error pair is present", () => {
      expect(() =>
        validateQueryParams({ state: "foo", error: "missing-desc" }, "foo")
      ).toThrow("Invalid request");
      expect(() => validateQueryParams({ state: "foo" }, "foo")).toThrow(
        "Invalid request"
      );
    });
  });

  describe("exchangeCodeForToken", () => {
    const mockExpressConfig = {
      clientSessionId: "clientsessionid",
      persistentSessionId: "persistentsessionid",
      sessionId: "sessionid",
      sourceIp: "sourceip",
      txmaAuditEncoded: "txma-audit-encoded",
      userLanguage: "en",
    } as any;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should construct the JWT and POST the form-urlencoded body", async () => {
      vi.mocked(kmsService.getPublicKey).mockResolvedValue(mockPublicKey);
      vi.mocked(kmsService.sign).mockResolvedValue({
        Signature: Buffer.from("simulated-signature"),
        KeyId: "",
        SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_512",
        $metadata: {},
      } as unknown as SignCommandOutput);

      const mockTokenResponse = {
        access_token: "new-access-token",
        token_type: "Bearer",
        expires_in: 60,
      };
      vi.mocked(http.client.post).mockResolvedValue({
        data: mockTokenResponse,
      });

      const result = await exchangeCodeForToken(
        "auth-code-123",
        mockExpressConfig
      );

      expect(result).toEqual(mockTokenResponse);

      expect(kmsService.sign).toHaveBeenCalledWith(
        expect.stringContaining(".")
      );

      expect(http.client.post).toHaveBeenCalledWith(
        "https://test.com",
        expect.stringContaining("grant_type=authorization_code"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/x-www-form-urlencoded",
          }),
        })
      );

      const callArgs = vi.mocked(http.client.post).mock.calls[0];
      const bodyParams = new URLSearchParams(callArgs[1] as string);

      expect(bodyParams.get("code")).toBe("auth-code-123");
      expect(bodyParams.get("client_assertion")).toBeDefined();
      expect(bodyParams.get("client_assertion")).toContain(".");
    });

    it("should fail if the HTTP request fails", async () => {
      vi.mocked(kmsService.getPublicKey).mockResolvedValue(mockPublicKey);
      vi.mocked(kmsService.sign).mockResolvedValue({
        Signature: Buffer.from("sig"),
      } as unknown as SignCommandOutput);
      vi.mocked(http.client.post).mockRejectedValue(new Error("Network Error"));

      await expect(
        exchangeCodeForToken("code", mockExpressConfig)
      ).rejects.toThrow("Network Error");
    });
  });

  describe("getJourneyOutcomeResponse", () => {
    const mockToken = "test-token-123";
    const mockData = { id: "journey-1", status: "completed" };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should inject the bearer token and return response data", async () => {
      vi.mocked(http.client.get).mockResolvedValue({ data: mockData });

      const config = { params: { id: "123" } };
      const result = await getJourneyOutcomeResponse(mockToken, config);

      expect(http.client.get).toHaveBeenCalledWith(
        "https://journey-outcome.co.uk",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );

      expect(result).toEqual(mockData);
    });

    it("should throw an error when the HTTP request fails", async () => {
      const mockError = new Error("Request failed with status code 500");
      vi.mocked(http.client.get).mockRejectedValue(mockError);

      const mockToken = "expired-token";
      const config = {};

      await expect(
        getJourneyOutcomeResponse(mockToken, config)
      ).rejects.toThrow("Request failed with status code 500");

      expect(http.client.get).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleJourneyOutcomeResponse", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
      vi.clearAllMocks();
      req = {
        metrics: { addMetric: vi.fn() },
        log: { error: vi.fn() },
      };
      res = { redirect: vi.fn() };
    });

    it("should redirect to confirmation on successful creation", async () => {
      const outcome = {
        success: true,
        scope: "passkey-create",
        journeys: [
          {
            journey: "passkey-create",
            details: {},
            success: true,
          },
        ],
      };

      await handleJourneyOutcomeResponse(req, res, outcome as any);
      expect(res.redirect).toHaveBeenCalledWith("/todo-passkey-confirmation");
    });

    it("should call handleLogout when error is UserSignedOut", async () => {
      const outcome = {
        success: false,
        scope: "passkey-create",
        journeys: [
          {
            journey: "passkey-create",
            details: { error: { description: "UserSignedOut" } },
          },
        ],
      };

      await handleJourneyOutcomeResponse(req, res, outcome as any);
      expect(handleLogout).toHaveBeenCalledWith(
        req,
        res,
        LogoutState.AmcSignedOut
      );
    });

    it("should redirect when passkey creation aborted", async () => {
      const outcome = {
        success: false,
        scope: "passkey-create",
        journeys: [
          {
            journey: "passkey-create",
            details: { error: { description: "UserAbortedJourney" } },
          },
        ],
      };

      await handleJourneyOutcomeResponse(req, res, outcome as any);
      expect(res.redirect).toHaveBeenCalledWith("/todo-user-aborted");
    });

    it("should log error when journey does not match scope", async () => {
      const errorObj = { description: "UnknownError" };
      const outcome = {
        outcome_id: "foo",
        success: true,
        scope: "passkey-create",
        journeys: [{ journey: "not-matching", details: { error: errorObj } }],
      };

      await handleJourneyOutcomeResponse(req, res, outcome as any);
      expect(req.metrics.addMetric).toHaveBeenCalledWith(
        "UnrecognisedJourneyOutcome",
        MetricUnit.Count,
        1
      );
      expect(req.log.error).toHaveBeenCalledWith(
        "UnrecognisedJourneyOutcome with outcome_id foo"
      );
      expect(res.redirect).toHaveBeenCalledWith(
        "/todo-handle-unrecognized-journey"
      );
    });

    it("should log error for unrecognised outcome", async () => {
      const errorObj = { description: "UnknownError" };
      const outcome = {
        outcome_id: "bar",
        success: false,
        scope: "invalid",
        journeys: [{ journey: "invalid", details: { error: errorObj } }],
      };

      await handleJourneyOutcomeResponse(req, res, outcome as any);
      expect(req.metrics.addMetric).toHaveBeenCalledWith(
        "UnrecognisedJourneyOutcome",
        MetricUnit.Count,
        1
      );
      expect(req.log.error).toHaveBeenCalledWith(
        "UnrecognisedJourneyOutcome with outcome_id bar"
      );
      expect(res.redirect).toHaveBeenCalledWith(
        "/todo-handle-unrecognized-journey"
      );
    });
  });
});
