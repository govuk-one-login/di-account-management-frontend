import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../utils/test-utils";
import { updateSessionMiddleware } from "../../../src/middleware/update-session-middleware";
import { logger } from "../../../src/utils/logger";

describe("updateSessionMiddleware", () => {
  let mockRequest: any;
  let mockResponse: any;
  let nextFunction: sinon.SinonStub;
  let loggerErrorSpy: sinon.SinonSpy;

  beforeEach(() => {
    // Mock request, response, and next function
    mockRequest = {
      session: {},
      query: {},
    };

    mockResponse = {
      locals: {
        sessionId: "session-id",
      },
    };

    nextFunction = sinon.stub();

    // Spy on logger's error method
    loggerErrorSpy = sinon.spy(logger, "error");
  });

  afterEach(() => {
    // Restore the spied upon methods
    loggerErrorSpy.restore();
  });

  it("should set session.queryParameters.fromURL if it's a valid URL", () => {
    mockRequest.query.fromURL = "https://valid-url.com";
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

    expect(mockRequest.session.queryParameters.fromURL).to.equal(
      "https://valid-url.com"
    );
    expect(loggerErrorSpy.notCalled).to.be.true;
  });

  it("should not set session.queryParameters.fromURL if the string is not safe", () => {
    mockRequest.query.theme = "hEllo***";
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

    expect(loggerErrorSpy.calledOnce).to.be.true;
  });

  it("should log an error for invalid fromURL", () => {
    mockRequest.query.fromURL = "invalid-url";
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

    expect(loggerErrorSpy.calledOnce).to.be.true;
    expect(mockRequest.session.queryParameters.fromURL).to.be.undefined;
  });

  it("should copy valid theme to session", () => {
    mockRequest.query.theme = "light";
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

    expect(mockRequest.session.queryParameters.theme).to.equal("light");
  });

  it("should generate referenceCode if not present in session", () => {
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

    expect(mockRequest.session.referenceCode).to.not.be.undefined;
  });

  it("should not overwrite existing referenceCode", () => {
    mockRequest.session.referenceCode = "existing-code";
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

    expect(mockRequest.session.referenceCode).to.equal("existing-code");
  });

  it("should call the next function once", () => {
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

    expect(nextFunction.calledOnce).to.be.true;
  });
});
