import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PATH_DATA, WELL_KNOWN_FILES } from "../../../app.constants";

describe("Integration::redirects", () => {
  let app: any;

  beforeAll(async () => {
    vi.resetModules();
    const oidc = await import("../../../utils/oidc.js");
    vi.spyOn(oidc, "getOIDCClient").mockImplementation(() => {
      return Promise.resolve({});
    });
    app = await (await import("../../../app.js")).createApp();
  });

  afterAll(() => {
    vi.restoreAllMocks();
    app = undefined;
  });

  describe("security.txt", () => {
    it("302 redirects to cabinet office security.txt", async () => {
      const res = await request(app)
        .get(PATH_DATA.SECURITY_TXT.url)
        .expect("Location", WELL_KNOWN_FILES.SECURITY_TEXT_URL)
        .expect(302);
      expect(res.statusCode).toBe(302);
    });
  });

  describe("thanks.txt", () => {
    it("302 redirects to cabinet office thanks.txt", async () => {
      const res = await request(app)
        .get(PATH_DATA.THANKS_TXT.url)
        .expect("Location", WELL_KNOWN_FILES.THANKS_TEXT_URL)
        .expect(302);
      expect(res.statusCode).toBe(302);
    });
  });
});
