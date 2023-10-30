import {
  buildContactEmailServiceUrl,
  ExpectedParams,
} from "../track-and-redirect-controller";
import { Request } from "express";
import { expect } from "chai";
import { describe } from "mocha";
import sinon from "sinon";
import { logger } from "../../../utils/logger";
import * as config from "../../../config";

describe("buildContactEmailServiceUrl", () => {
  let req: Partial<Request>;
  let logInfoSpy: sinon.SinonSpy;

  beforeEach(() => {
    sinon.stub(config, "getContactEmailServiceUrl").returns("http://base.url");
    req = {
      session: {
        queryParameters: {},
      },
    } as any;
    logInfoSpy = sinon.spy(logger, "info");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should append expected parameters to URL", () => {
    req.session.queryParameters = {
      fromURL: "testFromURL",
      theme: "testTheme",
      appSessionId: "testAppSessionId",
      appErrorCode: "testAppErrorCode",
    };

    const result = buildContactEmailServiceUrl(req as Request);

    for (const paramValue of Object.values(ExpectedParams)) {
      expect(result.searchParams.get(paramValue)).to.equal(
        req.session.queryParameters[paramValue]
      );
    }
  });

  it("should log missing parameters", () => {
    buildContactEmailServiceUrl(req as Request);
    expect(logInfoSpy.callCount).to.equal(4);
    for (const paramValue of Object.values(ExpectedParams)) {
      expect(
        logInfoSpy.calledWith(
          `Missing ${paramValue} in the request or session.`
        )
      ).to.be.true;
    }
  });
});
