import { describe } from "mocha";
import { expect } from "chai";
import { Request } from "express";
import { spy, SinonSpy } from "sinon";

import { logger } from "../../utils/logger";
import { getTxmaHeader } from "../txma-header";

describe("getTxmaHeader", () => {
  const TRACE = "trace";
  let loggerWarnSpy: SinonSpy;

  beforeEach(() => {
    loggerWarnSpy = spy(logger, "warn");
  });

  afterEach(() => {
    loggerWarnSpy.restore();
  });

  it("returns the header value when the header is present", () => {
    const TXMA_HEADER_VALUE = "TXMA_HEADER_VALUE";
    const request: Partial<Request> = {
      headers: {
        "txma-audit-encoded": TXMA_HEADER_VALUE,
      },
    };

    const result = getTxmaHeader(request as Request, TRACE);

    expect(result).to.eq(TXMA_HEADER_VALUE);
    expect(loggerWarnSpy.notCalled).to.be.true;
  });

  it("returns an empty string when the header is not present", () => {
    const request: Partial<Request> = {
      headers: {
        "a-different-header": "a-different-value",
      },
    };

    const result = getTxmaHeader(request as Request, TRACE);

    expect(result).to.be.undefined;
    expect(loggerWarnSpy.calledOnce).to.be.true;
  });
});
