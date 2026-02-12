import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { PATH_DATA } from "../../../app.constants";

describe("Integration::healthcheck", () => {
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

  it("healthcheck should return 200 OK", async () => {
    const res = await request(app).get(PATH_DATA.HEALTHCHECK.url).expect(200);
    expect(res.statusCode).toBe(200);
  });
});
