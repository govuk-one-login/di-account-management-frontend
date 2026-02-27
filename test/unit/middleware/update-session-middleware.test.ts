import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { updateSessionMiddleware } from "../../../src/middleware/update-session-middleware.js";
import { logger } from "../../../src/utils/logger.js";

const CURRENT_GS_SESSION_ID = "session-id";
const REFERENCE_CODE = "reference-code";
const ANOTHER_GS_SESSION_ID = "another-session";
describe("updateSessionMiddleware", () => {
  let mockRequest: any;
  let mockResponse: any;
  let nextFunction: ReturnType<typeof vi.fn>;
  let loggerWarnSpy: ReturnType<typeof vi.fn>;

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

    nextFunction = vi.fn();

    loggerWarnSpy = vi.spyOn(logger, "warn");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should set session.queryParameters.fromURL if it's a valid URL", () => {
    mockRequest.query.fromURL = "https://valid-url.com/";
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

    expect(mockRequest.session.queryParameters.fromURL).toBe(
      "https://valid-url.com/"
    );
    expect(loggerWarnSpy).not.toHaveBeenCalled();
  });

  it("should not set session.queryParameters.fromURL if the string is not safe", () => {
    mockRequest.query.theme = "hEllo***";
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

    expect(loggerWarnSpy).toHaveBeenCalledTimes(2);
  });

  it("should log a warning for invalid fromURL", () => {
    mockRequest.query.fromURL = "invalid-url";
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);
    expect(loggerWarnSpy).toHaveBeenCalled();
    expect(mockRequest.session.queryParameters.fromURL).toBeUndefined();
  });

  it("should copy valid theme to session", () => {
    mockRequest.query.theme = "light";
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

    expect(mockRequest.session.queryParameters.theme).toBe("light");
  });

  describe("Reference Codes", () => {
    it("should create a new reference code when one is not present in the session", () => {
      // Arrange
      expect(mockRequest.session).not.toHaveProperty("referenceCode");
      expect(mockRequest.session).not.toHaveProperty(
        "referenceCodeOwningSessionId"
      );
      expect(mockResponse.locals).toHaveProperty("sessionId");

      // Act
      updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

      // Assert
      expect(mockRequest.session).toHaveProperty("referenceCode");
      expect(mockRequest.session).toHaveProperty(
        "referenceCodeOwningSessionId"
      );
      expect(mockRequest.session.referenceCodeOwningSessionId).toBe(
        CURRENT_GS_SESSION_ID
      );
    });

    it("should create a new referenceCode when the one in the session was created when there wasn't a GS session", () => {
      // Arrange
      const session = mockRequest.session;
      expect(session).not.toHaveProperty("referenceCodeOwningSessionId");
      session.referenceCode = REFERENCE_CODE;
      expect(mockResponse.locals).toHaveProperty("sessionId");

      // Act
      updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

      // Assert
      expect(mockRequest.session.referenceCode).not.toBe(REFERENCE_CODE);
      expect(mockRequest.session).toHaveProperty(
        "referenceCodeOwningSessionId"
      );
      expect(mockRequest.session.referenceCodeOwningSessionId).toBe(
        CURRENT_GS_SESSION_ID
      );
    });

    it("should create a new referenceCode if the one in the session was not created for the current GS session", () => {
      // Arrange
      mockRequest.session.referenceCode = REFERENCE_CODE;
      mockRequest.session.referenceCodeOwningSessionId = ANOTHER_GS_SESSION_ID;
      expect(mockResponse.locals).toHaveProperty("sessionId");

      // Act
      updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

      // Assert
      expect(mockRequest.session.referenceCode).not.toBe(REFERENCE_CODE);
      expect(mockRequest.session.referenceCodeOwningSessionId).toBe(
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
      expect(mockRequest.session.referenceCode).toBe("existing-reference-code");
    });
  });

  it("should call the next function once", () => {
    updateSessionMiddleware(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).toHaveBeenCalledOnce();
  });
});
