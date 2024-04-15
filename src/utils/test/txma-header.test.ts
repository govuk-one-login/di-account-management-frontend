import { describe } from "mocha";
import { expect } from "chai";
import { Request } from "express";

import { getTxmaHeader } from "../txma-header";

describe("getTxmaHeader", () => {
  it("returns the header value when the header is present", () => {
    const TXMA_HEADER_VALUE = "TXMA_HEADER_VALUE";
    const request: Partial<Request> = {
      headers: {
        "txma-audit-encoded": TXMA_HEADER_VALUE,
      },
    };

    const result = getTxmaHeader(request as Request);

    expect(result).to.eq(TXMA_HEADER_VALUE);
  });
  it("returns an empty string when the header is not present", () => {
    const request: Partial<Request> = {
      headers: {
        "a-different-header": "a-different-value",
      },
    };

    const result = getTxmaHeader(request as Request);

    expect(result).to.eq("");
  });
});
