import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request } from "express";
import { getPasswordJourneyRenderOptions } from "./getPasswordJourneyRenderOptions.js";
import { UserJourney } from "../utils/state-machine.js";
import { convertPageQueryStringToNumber } from "./convertPageQueryStringToNumber.js";

vi.mock("./convertPageQueryStringToNumber.js", () => ({
  convertPageQueryStringToNumber: vi.fn(),
}));

vi.mock("../types.js", () => {
  return {
    AMJourneyValidBackRoutes: {
      security: { url: "/security" },
      "activity-history": { url: "/activity-history" },
    },
  };
});

describe("getPasswordJourneyRenderOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return basic locals when query parameters are missing", () => {
    const req = {
      url: "/change-password",
      query: {},
    } as unknown as Request;

    const result = getPasswordJourneyRenderOptions(req);

    expect(result).toEqual({
      formAction: "/change-password",
    });
  });

  it("should handle valid 'from' query parameter without page number", () => {
    const req = {
      url: "/change-password",
      query: { from: "security" },
    } as unknown as Request;

    const result = getPasswordJourneyRenderOptions(req);

    expect(result).toEqual({
      formAction: "/change-password",
      from: "security",
      fromDetails: { url: "/security" },
    });
  });

  it("should return 'page' when both 'from' and 'page' query parameters are valid", () => {
    vi.mocked(convertPageQueryStringToNumber).mockReturnValue(2);

    const req = {
      url: "/change-password",
      query: { from: "activity-history", page: "2" },
    } as unknown as Request;

    const result = getPasswordJourneyRenderOptions(req);

    expect(convertPageQueryStringToNumber).toHaveBeenCalledWith("2");
    expect(result).toEqual({
      formAction: "/change-password",
      from: "activity-history",
      page: 2,
      fromDetails: { url: "/activity-history?page=2" },
    });
  });

  it("should ignore an invalid 'from'", () => {
    const req = {
      url: "/change-password",
      query: { from: "INVALID_ROUTE" },
    } as unknown as Request;

    const result = getPasswordJourneyRenderOptions(req);

    expect(result).toEqual({
      formAction: "/change-password",
    });
  });

  it("should not include 'page' if 'from' is invalid", () => {
    vi.mocked(convertPageQueryStringToNumber).mockReturnValue(5);

    const req = {
      url: "/change-password",
      query: { from: "INVALID_ROUTE", page: "5" },
    } as unknown as Request;

    const result = getPasswordJourneyRenderOptions(req);

    expect(result).toEqual({
      formAction: "/change-password",
    });
  });

  it("should ignore 'page' if convertPageQueryStringToNumber returns undefined", () => {
    vi.mocked(convertPageQueryStringToNumber).mockReturnValue(undefined);

    const req = {
      url: "/change-password",
      query: { from: "activity-history", page: "iiiswlw.124" },
    } as unknown as Request;

    const result = getPasswordJourneyRenderOptions(req);

    expect(result).toEqual({
      formAction: "/change-password",
      from: "activity-history",
      fromDetails: { url: "/activity-history" },
    });
  });

  it("should include requestType when provided", () => {
    const req = {
      url: "/change-password",
      query: {},
    } as unknown as Request;

    const mockJourney = "changePassword" as unknown as UserJourney;

    const result = getPasswordJourneyRenderOptions(req, mockJourney);

    expect(result).toEqual({
      formAction: "/change-password",
      requestType: "changePassword",
    });
  });
});
