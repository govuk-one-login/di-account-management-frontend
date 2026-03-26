import { describe, it, expect, vi, beforeEach } from "vitest";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import type { Request } from "express";

const mockAddMetadata = vi.fn();
const mockAddMetric = vi.fn();
const mockLoggerWarn = vi.fn();

const mockRequest = {
  metrics: {
    addMetadata: mockAddMetadata,
    addMetric: mockAddMetric,
  },
  log: {
    warn: mockLoggerWarn,
  },
} as unknown as Request;

const validEntry = {
  name: "Test Authenticator",
  icon_dark: "data:image/png;base64,abc",
  icon_light: "data:image/svg+xml;base64,def",
};

const validEntryNoIcons = {
  name: "Minimal Authenticator",
};

const mockMetadata: Record<
  string,
  { name: string; icon_dark?: string; icon_light?: string }
> = {
  "aaguid-1": validEntry,
  "aaguid-2": validEntryNoIcons,
};

vi.mock(
  import("../../../submodules/passkey-authenticator-aaguids/combined_aaguid.json"),
  (() => ({ default: mockMetadata })) as unknown as undefined
);

describe("passkeysConvenienceMetadata", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("getAllPasskeyConvenienceMetadata", () => {
    it("returns parsed metadata for valid entries", async () => {
      const { getAllPasskeyConvenienceMetadata } = await import("./index.js");

      const result = await getAllPasskeyConvenienceMetadata();

      expect(result).toStrictEqual(mockMetadata);
    });

    it("caches the result on subsequent calls", async () => {
      const { getAllPasskeyConvenienceMetadata } = await import("./index.js");

      const first = await getAllPasskeyConvenienceMetadata();
      const second = await getAllPasskeyConvenienceMetadata();

      expect(first).toBe(second);
    });

    it("throws when metadata contains an obscene name", async () => {
      vi.doMock(
        import("../../../submodules/passkey-authenticator-aaguids/combined_aaguid.json"),
        (() => ({
          default: {
            "bad-aaguid": { name: "tit" },
          },
        })) as unknown as undefined
      );

      const { getAllPasskeyConvenienceMetadata } = await import("./index.js");

      await expect(getAllPasskeyConvenienceMetadata()).rejects.toThrow(
        "Failed to parse passkey convenience metadata"
      );
    });

    it("throws when an icon value is not a data URI", async () => {
      vi.doMock(
        import("../../../submodules/passkey-authenticator-aaguids/combined_aaguid.json"),
        (() => ({
          default: {
            "bad-icon": {
              name: "Bad Icon Authenticator",
              icon_dark: "https://example.com/icon.png",
            },
          },
        })) as unknown as undefined
      );

      const { getAllPasskeyConvenienceMetadata } = await import("./index.js");

      await expect(getAllPasskeyConvenienceMetadata()).rejects.toThrow(
        "Failed to parse passkey convenience metadata"
      );
    });

    it("throws when name is missing", async () => {
      vi.doMock(
        import("../../../submodules/passkey-authenticator-aaguids/combined_aaguid.json"),
        (() => ({
          default: {
            "no-name": { icon_dark: "data:image/png;base64,abc" },
          },
        })) as unknown as undefined
      );

      const { getAllPasskeyConvenienceMetadata } = await import("./index.js");

      await expect(getAllPasskeyConvenienceMetadata()).rejects.toThrow(
        "Failed to parse passkey convenience metadata"
      );
    });
  });

  describe("getPasskeyConvenienceMetadataByAaguid", () => {
    it("returns metadata for a known aaguid", async () => {
      vi.doMock(
        import("../../../submodules/passkey-authenticator-aaguids/combined_aaguid.json"),
        (() => ({ default: mockMetadata })) as unknown as undefined
      );

      const { getPasskeyConvenienceMetadataByAaguid } =
        await import("./index.js");

      const result = await getPasskeyConvenienceMetadataByAaguid(mockRequest, "aaguid-1");

      expect(result).toStrictEqual(validEntry);
    });

    it("returns undefined for an unknown aaguid", async () => {
      vi.doMock(
        import("../../../submodules/passkey-authenticator-aaguids/combined_aaguid.json"),
        (() => ({ default: mockMetadata })) as unknown as undefined
      );

      const { getPasskeyConvenienceMetadataByAaguid } =
        await import("./index.js");

      const result = await getPasskeyConvenienceMetadataByAaguid(mockRequest, "nonexistent");

      expect(result).toBeUndefined();
    });

    it("logs a warning and emits a metric for an unknown aaguid", async () => {
      vi.doMock(
        import("../../../submodules/passkey-authenticator-aaguids/combined_aaguid.json"),
        (() => ({ default: mockMetadata })) as unknown as undefined
      );

      const { getPasskeyConvenienceMetadataByAaguid } =
        await import("./index.js");

      await getPasskeyConvenienceMetadataByAaguid(mockRequest, "nonexistent");

      expect(mockAddMetadata).toHaveBeenCalledWith(
        "PasskeyAaguid",
        "nonexistent"
      );
      expect(mockAddMetric).toHaveBeenCalledWith(
        "AaguidNotFoundInPasskeysConvenienceMetadata",
        MetricUnit.Count,
        1
      );
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        "AaguidNotFoundInPasskeysConvenienceMetadata",
        { aaguid: "nonexistent" }
      );
    });

    it("does not log or emit a metric for a known aaguid", async () => {
      vi.doMock(
        import("../../../submodules/passkey-authenticator-aaguids/combined_aaguid.json"),
        (() => ({ default: mockMetadata })) as unknown as undefined
      );

      const { getPasskeyConvenienceMetadataByAaguid } =
        await import("./index.js");

      await getPasskeyConvenienceMetadataByAaguid(mockRequest, "aaguid-1");

      expect(mockAddMetadata).not.toHaveBeenCalled();
      expect(mockAddMetric).not.toHaveBeenCalled();
      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });
  });
});
