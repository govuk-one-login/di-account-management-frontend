import { describe, it, expect, vi, beforeEach } from "vitest";

describe("applyOverloadProtection", () => {
  let overloadProtectionStub: any;
  let applyOverloadProtection: any;

  beforeEach(async () => {
    vi.resetModules();

    overloadProtectionStub = vi.fn();

    vi.doMock("overload-protection", () => ({
      default: overloadProtectionStub,
    }));

    const module = await import(
      "../../../src/middleware/overload-protection-middleware.js"
    );
    applyOverloadProtection = module.applyOverloadProtection;
  });

  it("should call overloadProtection with correct options in production mode", () => {
    const isProduction = true;
    applyOverloadProtection(isProduction);
    expect(overloadProtectionStub).toHaveBeenCalledWith(
      "express",
      expectedOverloadProtectionConfig(true)
    );
  });

  it("should call overloadProtection with correct options in non-production mode", () => {
    const isProduction = false;
    applyOverloadProtection(isProduction);
    expect(overloadProtectionStub).toHaveBeenCalledWith(
      "express",
      expectedOverloadProtectionConfig(false)
    );
  });
});

function expectedOverloadProtectionConfig(isProduction: boolean) {
  return {
    production: isProduction,
    clientRetrySecs: 3,
    sampleInterval: 10,
    maxEventLoopDelay: 500,
    maxHeapUsedBytes: 0,
    maxRssBytes: 0,
    errorPropagationMode: false,
    logging: "warn",
    logStatsOnReq: false,
  };
}
