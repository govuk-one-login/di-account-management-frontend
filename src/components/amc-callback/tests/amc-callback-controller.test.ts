import { describe, it, expect, vi, beforeEach } from "vitest";
import { amcCallbackGet } from "../amc-callback-controller.js";

import * as utils from "../amc-callback-utils.js";
import * as requestConfigUtils from "../../../utils/http.js";
import type { TokenResponse } from "../amc-callback-utils.js";

vi.mock("../amc-callback-utils");
vi.mock("../../../utils/http.js");

describe("amcCallbackGet", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      query: {},
      session: {
        amcStates: ["state-test"],
      },
      log: { error: vi.fn() },
      metrics: { addMetric: vi.fn() },
    };
    res = {
      render: vi.fn(),
      status: vi.fn(),
    };

    vi.mocked(requestConfigUtils.getRequestConfigFromExpress).mockResolvedValue(
      { some: "config" } as any
    );
    vi.mocked(requestConfigUtils.getRequestConfig).mockReturnValue({
      axios: "config",
    } as any);
  });

  it("should delete user state if query parameter validation completes successfully", async () => {
    req.query = {
      error: "access_denied",
      error_description: "User cancelled",
      state: "state-test",
    };

    await amcCallbackGet(req, res);

    expect(req.log.error).not.toHaveBeenCalledWith(
      "Invalid request: Must provide 'state'"
    );

    expect(req.session.amcStates).toEqual([]);
  });

  it("should log error and redirect if query parameter validation fails", async () => {
    vi.mocked(utils.validateQueryParams).mockImplementation(() => {
      throw new Error("Mock error thrown");
    });

    await amcCallbackGet(req, res);

    expect(req.log.error).toHaveBeenCalledWith("Mock error thrown");
    expect(res.render).toHaveBeenCalledWith("common/errors/500.njk");

    expect(req.session.amcStates).toEqual(["state-test"]);
  });

  it("should redirect if an error or error_description is present in query", async () => {
    req.query = { error: "access_denied", error_description: "User cancelled" };
    vi.mocked(utils.validateQueryParams).mockReturnValue(undefined);
    await amcCallbackGet(req, res);

    expect(req.log.error).toHaveBeenCalledWith(
      expect.stringContaining("access_denied")
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.render).toHaveBeenCalledWith("common/errors/500.njk");
  });

  it("should exchange code for token and handle journey outcome on success", async () => {
    req.query = { code: "valid-code" };
    vi.mocked(utils.validateQueryParams).mockReturnValue(undefined);
    const mockToken: TokenResponse = {
      access_token: "fake-token",
      token_type: "Bearer",
      expires_in: 3600,
    };
    const mockOutcome = { success: true };

    vi.mocked(utils.exchangeCodeForToken).mockResolvedValue(mockToken);
    vi.mocked(utils.isValidTokenResponse).mockReturnValue(true);
    vi.mocked(utils.getJourneyOutcomeResponse).mockResolvedValue(
      mockOutcome as any
    );

    await amcCallbackGet(req, res);

    expect(utils.exchangeCodeForToken).toHaveBeenCalledWith(
      "valid-code",
      expect.anything()
    );
    expect(utils.handleJourneyOutcomeResponse).toHaveBeenCalledWith(
      req,
      res,
      mockOutcome
    );
  });

  it("should throw error if token response is invalid", async () => {
    req.query = { code: "valid-code" };
    vi.mocked(utils.exchangeCodeForToken).mockResolvedValue({} as any);
    vi.mocked(utils.isValidTokenResponse).mockReturnValue(false);

    await expect(amcCallbackGet(req, res)).rejects.toThrow(
      "Response did not match expected TokenResponse"
    );
  });
});
