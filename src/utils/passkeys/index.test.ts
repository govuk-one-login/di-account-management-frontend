import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatPasskeysForRender } from "./index.js"; // Update this path
import { getPasskeyConvenienceMetadataByAaguid } from "../passkeysConvenienceMetadata/index.js";
import { Request } from "express";

vi.mock("../passkeysConvenienceMetadata/index.js", () => ({
  getPasskeyConvenienceMetadataByAaguid: vi.fn(),
}));

describe("formatPasskeysForRender", () => {
  const mockReq = { language: "en" } as Request;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should sort passkeys by lastUsedAt (desc) then by createdAt (desc)", async () => {
    const passkeys = [
      {
        id: "old-last-used",
        aaguid: "1",
        createdAt: "2023-01-01T10:00:00Z",
        lastUsedAt: "2023-01-01T10:00:00Z",
      },
      {
        id: "new-last-used",
        aaguid: "2",
        createdAt: "2023-01-01T10:00:00Z",
        lastUsedAt: "2023-05-01T10:00:00Z",
      },
      {
        id: "only-created-new",
        aaguid: "3",
        createdAt: "2023-04-01T10:00:00Z",
      },
      {
        id: "only-created-old",
        aaguid: "4",
        createdAt: "2023-02-01T10:00:00Z",
      },
    ] as any;

    vi.mocked(getPasskeyConvenienceMetadataByAaguid).mockResolvedValue({
      name: "Mock Device",
    });

    const result = await formatPasskeysForRender(mockReq, passkeys);

    expect(result.map((p) => p.id)).toEqual([
      "new-last-used",
      "old-last-used",
      "only-created-new",
      "only-created-old",
    ]);
  });

  it("should format dates correctly using en-GB locale", async () => {
    const passkeys = [
      {
        id: "1",
        aaguid: "abc",
        createdAt: "2023-01-01T12:00:00Z",
        lastUsedAt: "2023-12-25T12:00:00Z",
      },
    ] as any;

    const reqEn = { language: "en" } as Request;

    vi.mocked(getPasskeyConvenienceMetadataByAaguid).mockResolvedValue({
      name: "iPhone",
    });

    const result = await formatPasskeysForRender(reqEn, passkeys);

    expect(result[0]).toEqual({
      id: "1",
      name: "iPhone",
      createdAt: "1 January 2023",
      lastUsedAt: "25 December 2023",
    });
  });

  it("should format dates correctly using Welsh locale", async () => {
    const passkeys = [
      {
        id: "1",
        aaguid: "abc",
        createdAt: "2023-01-01T12:00:00Z",
        lastUsedAt: "2023-12-25T12:00:00Z",
      },
    ] as any;

    const reqCy = { language: "cy" } as Request;

    vi.mocked(getPasskeyConvenienceMetadataByAaguid).mockResolvedValue({
      name: "iPhone",
    });

    const result = await formatPasskeysForRender(reqCy, passkeys);

    expect(result[0]).toEqual({
      id: "1",
      name: "iPhone",
      createdAt: "1 Ionawr 2023",
      lastUsedAt: "25 Rhagfyr 2023",
    });
  });

  it("should handle missing metadata gracefully", async () => {
    const passkeys = [
      { id: "1", aaguid: "unknown", createdAt: "2023-01-01T10:00:00Z" },
    ] as any;

    vi.mocked(getPasskeyConvenienceMetadataByAaguid).mockResolvedValue(
      undefined
    );

    const result = await formatPasskeysForRender(mockReq, passkeys);

    expect(result[0].name).toBeUndefined();
    expect(result[0].id).toBe("1");
  });

  it("should handle empty lastUsedAt gracefully", async () => {
    const passkeys = [
      {
        id: "1",
        aaguid: "abc",
        createdAt: "2023-01-01T12:00:00Z",
      },
    ] as any;

    vi.mocked(getPasskeyConvenienceMetadataByAaguid).mockResolvedValue({
      name: "iPhone",
    });

    const result = await formatPasskeysForRender(mockReq, passkeys);

    expect(result[0]).toEqual({
      id: "1",
      name: "iPhone",
      createdAt: "1 January 2023",
      lastUsedAt: undefined,
    });
  });
});
