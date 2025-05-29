import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../utils/test-utils";
import { updateSessionMiddleware } from "../../../src/middleware/update-session-middleware";
import { logger } from "../../../src/utils/logger";

const CURRENT_GS_SESSION_ID = "session-id";
const REFERENCE_CODE = "reference-code";
const ANOTHER_GS_SESSION_ID = "another-session";
describe("updateSessionMiddleware", () => {
  let mockRequest: any;
  let mockResponse: any;
  let nextFunction: sinon.SinonStub;
  let loggerWarnSpy: sinon.SinonSpy;

  beforeEach(() => {
    // Mock request, response, and next function
    mockRequest = {
      session: {},
      query: {},
    };

    mockResponse = {
      locals: {
        sessionId: CURRENT_GS_SESSION_ID,
      },
    };

    nextFunction = sinon.stub();

    loggerWarnSpy = sinon.spy(logger, "warn");
  });

  afterEach(() => {
    // Restore the spied upon methods
    loggerWarnSpy.restore();
  });

  it("should set session.queryParameters.fromURL if it's a valid URL", () => {
    mockRequest.query.fromURL = "https://valid-url.com/";
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

    expect(mockRequest.session.queryParameters.fromURL).to.equal(
      "https://valid-url.com/"
    );
    expect(loggerWarnSpy.notCalled).to.be.true;
  });

  it("should not set session.queryParameters.fromURL if the string is not safe", () => {
    mockRequest.query.theme = "hEllo***";
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

    expect(loggerWarnSpy.calledTwice).to.be.true;
  });

  it("should log a warning for invalid fromURL", () => {
    mockRequest.query.fromURL = "invalid-url";
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);
    expect(loggerWarnSpy).to.be.calledWith({ url: "invalid-url" });
    expect(loggerWarnSpy).to.be.calledWith(
      { trace: mockResponse.locals.sessionId },
      "fromURL in request query for contact-govuk-one-login page did not pass validation:",
      "invalid-url"
    );
    expect(mockRequest.session.queryParameters.fromURL).to.be.undefined;
  });

  it("should copy valid theme to session", () => {
    mockRequest.query.theme = "light";
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

    expect(mockRequest.session.queryParameters.theme).to.equal("light");
  });

  describe("Reference Codes", () => {
    it("should create a new reference code when one is not present in the session", () => {
      // Arrange
      expect(mockRequest.session).to.not.have.property("referenceCode");
      expect(mockRequest.session).to.not.have.property(
        "referenceCodeOwningSessionId"
      );
      expect(mockResponse.locals).to.have.property("sessionId");

      // Act
      updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

      // Assert
      expect(mockRequest.session).to.have.property("referenceCode");
      expect(mockRequest.session).to.have.property(
        "referenceCodeOwningSessionId"
      );
      expect(mockRequest.session.referenceCodeOwningSessionId).to.equal(
        CURRENT_GS_SESSION_ID
      );
    });

    it("should create a new referenceCode when the one in the session was created when there wasn't a GS session", () => {
      // Arrange
      const session = mockRequest.session;
      expect(session).to.not.have.property("referenceCodeOwningSessionId");
      session.referenceCode = REFERENCE_CODE;
      expect(mockResponse.locals).to.have.property("sessionId");

      // Act
      updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

      // Assert
      expect(mockRequest.session.referenceCode).to.not.equal(REFERENCE_CODE);
      expect(mockRequest.session).to.have.property(
        "referenceCodeOwningSessionId"
      );
      expect(mockRequest.session.referenceCodeOwningSessionId).to.equal(
        CURRENT_GS_SESSION_ID
      );
    });

    it("should create a new referenceCode if the one in the session was not created for the current GS session", () => {
      // Arrange
      mockRequest.session.referenceCode = REFERENCE_CODE;
      mockRequest.session.referenceCodeOwningSessionId = ANOTHER_GS_SESSION_ID;
      expect(mockResponse.locals).to.have.property("sessionId");

      // Act
      updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

      // Assert
      expect(mockRequest.session.referenceCode).to.not.equal(REFERENCE_CODE);
      expect(mockRequest.session.referenceCodeOwningSessionId).equals(
        CURRENT_GS_SESSION_ID
      );
    });

    it("should not overwrite existing referenceCode when created for current GS session", () => {
      // Arrange
      mockRequest.session.referenceCodeOwningSessionId =
        "session that owns existing-reference-code";
      mockRequest.session.referenceCode = "existing-reference-code";
      mockResponse.locals.sessionId =
        "session that owns existing-reference-code";

      // Act
      updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

      // Assert
      expect(mockRequest.session.referenceCode).to.equal(
        "existing-reference-code"
      );
    });
  });

  it("should call the next function once", () => {
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

    expect(nextFunction.calledOnce).to.be.true;
  });
});
