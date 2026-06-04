import { describe, it, expect, vi } from "vitest";
import { getAmcRedirectUri } from "./getAmcRedirectUri.js";
import * as config from "../config.js";

vi.mock("../config.js", () => ({
  getAmcCallbackBaseUrl: vi.fn(),
  getBaseUrl: vi.fn().mockReturnValue("https://example.com"),
}));

describe("getAmcRedirectUri", () => {
  it("should construct redirect URI with scope parameter", () => {
    vi.spyOn(config, "getAmcCallbackBaseUrl").mockReturnValue(
      "https://home.example.com"
    );

    const result = getAmcRedirectUri("openid");

    expect(result).toBe("https://home.example.com/amc/callback?scope=openid");
  });

  it("should handle complex scopes with spaces", () => {
    vi.spyOn(config, "getAmcCallbackBaseUrl").mockReturnValue(
      "https://home.example.com"
    );

    const result = getAmcRedirectUri("openid profile email");

    expect(result).toBe(
      "https://home.example.com/amc/callback?scope=openid+profile+email"
    );
  });

  it("should handle different base URLs", () => {
    vi.spyOn(config, "getAmcCallbackBaseUrl").mockReturnValue(
      "https://callback.domain.co.uk"
    );

    const result = getAmcRedirectUri("testing-journey");

    expect(result).toBe(
      "https://callback.domain.co.uk/amc/callback?scope=testing-journey"
    );
  });
});
