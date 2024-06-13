import {
  buildContactEmailServiceUrl,
  ExpectedParams,
} from "../track-and-redirect-controller.js";
import { Request, Response } from "express";
import { expect } from "chai";
import { describe } from "mocha";
import sinon from "sinon";
import { logger } from "../../../utils/logger.js";
import * as config from "../../../config.js";

describe("buildContactEmailServiceUrl", () => {
  let req: Partial<Request>;
  let res: any;
  let logInfoSpy: sinon.SinonSpy;

  beforeEach(() => {
    sinon.stub(config, "getContactEmailServiceUrl").returns("http://base.url");
    req = {
      session: {
        queryParameters: {},
      },
    } as any;
    res = {
      locals: { sessionId: "session-id", trace: "trace-id" },
    };
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

    const result = buildContactEmailServiceUrl(req as Request, res as Response);

    for (const paramValue of Object.values(ExpectedParams)) {
      expect(result.searchParams.get(paramValue)).to.equal(
        req.session.queryParameters[paramValue]
      );
    }
  });

  it("should log missing parameters", () => {
    buildContactEmailServiceUrl(req as Request, res as Response);
    expect(logInfoSpy.callCount).to.equal(4);
    for (const paramValue of Object.values(ExpectedParams)) {
      expect(
        logInfoSpy.calledWith(
          { trace: "trace-id" },
          `Missing ${paramValue} in the request or session.`
        )
      ).to.be.true;
    }
  });
});
