import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createApiResponse,
  Http,
  getRequestConfig,
  getRequestConfigFromExpress,
} from "../http.js";
import { ApiError } from "../errors.js";
import * as oidcModule from "../oidc.js";
import * as txmaHeaderModule from "../txma-header.js";
import { RequestBuilder, ResponseBuilder } from "../../../test/utils/builders";
import { Request, Response as ExpressResponse } from "express";
import { HTTP_STATUS_CODES } from "../../app.constants.js";

const { mockLoggerError } = vi.hoisted(() => ({
  mockLoggerError: vi.fn(),
}));

vi.mock("../logger", () => ({
  logger: {
    error: (...args: any[]) => mockLoggerError(...args),
  },
}));

describe("createApiResponse", () => {
  const createMockResponse = (
    status: number,
    data: any,
    contentLength = "1"
  ) => {
    const isString = typeof data === "string";
    const textValue = isString ? data : JSON.stringify(data);
    const mockJsonFn = vi
      .fn()
      .mockImplementation(() =>
        textValue
          ? Promise.resolve(JSON.parse(textValue))
          : Promise.reject(new SyntaxError())
      );

    return {
      status,
      statusText:
        status === HTTP_STATUS_CODES.BAD_REQUEST ? "Bad Request" : "OK",
      headers: {
        get: vi.fn().mockReturnValue(contentLength),
      },
      clone: vi.fn().mockReturnValue({
        headers: { get: vi.fn().mockReturnValue(contentLength) },
        json: mockJsonFn,
      }),
      json: mockJsonFn,
    } as unknown as globalThis.Response;
  };

  it("returns success true when status is in default success statuses", async () => {
    const response = createMockResponse(HTTP_STATUS_CODES.OK, {
      code: "100",
      message: "Success",
    });

    const result = await createApiResponse(response);

    expect(result).toEqual({
      success: true,
      code: 100,
      message: "Success",
    });
  });

  it("returns success false when status is not in success statuses", async () => {
    const response = createMockResponse(HTTP_STATUS_CODES.BAD_REQUEST, {
      code: "1",
      message: "Error",
    });

    const result = await createApiResponse(response);

    expect(result).toEqual({
      success: false,
      code: 1,
      message: "Error",
    });
  });

  it("uses custom status codes when provided", async () => {
    const response = createMockResponse(HTTP_STATUS_CODES.BAD_REQUEST, {
      code: "1",
      message: "Error",
    });

    const result = await createApiResponse(response, [
      HTTP_STATUS_CODES.BAD_REQUEST,
    ]);

    expect(result).toEqual({
      success: true,
      code: 1,
      message: "Error",
    });
  });

  it("logs parsing failure containing trace", async () => {
    const brokenResponse = createMockResponse(
      HTTP_STATUS_CODES.BAD_REQUEST,
      "Invalid { JSON",
      "1"
    );
    const testTraceId = "trace-response-parsing-123";

    await createApiResponse(
      brokenResponse,
      [HTTP_STATUS_CODES.OK],
      testTraceId
    );

    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        trace: testTraceId,
        status: HTTP_STATUS_CODES.BAD_REQUEST,
        statusText: "Bad Request",
      }),
      expect.stringContaining("createApiResponse parsing failure")
    );
  });
});

describe("getRequestConfig", () => {
  it("returns basic config with required headers", () => {
    const config = getRequestConfig({
      token: "test-token",
      accountDataApiAccessToken: "api-token",
    });

    expect(config).toEqual({
      headers: {
        Authorization: "Bearer test-token",
        "X-ADAPI-AccessToken": "api-token",
      },
    });
  });

  it("returns config without X-ADAPI-AccessToken when accountDataApiAccessToken is not provided", () => {
    const config = getRequestConfig({
      token: "test-token",
    });

    expect(config).toEqual({
      headers: {
        Authorization: "Bearer test-token",
      },
    });
  });

  it("includes validation statuses when provided", () => {
    const validationStatuses = [
      HTTP_STATUS_CODES.OK,
      HTTP_STATUS_CODES.BAD_REQUEST,
    ];
    const config = getRequestConfig({
      token: "test-token",
      validationStatuses,
    });

    expect(config.validateStatus).toBeDefined();
    expect(config.validateStatus!(HTTP_STATUS_CODES.OK)).toBe(true);
    expect(config.validateStatus!(HTTP_STATUS_CODES.BAD_REQUEST)).toBe(true);
    expect(config.validateStatus!(500)).toBe(false);
  });

  it("includes optional headers and trace metadata parameters when provided", () => {
    const config = getRequestConfig({
      token: "test-token",
      accountDataApiAccessToken: "api-token",
      sourceIp: "192.168.1.1",
      persistentSessionId: "persistent-123",
      sessionId: "session-123",
      userLanguage: "en",
      clientSessionId: "client-123",
      txmaAuditEncoded: "audit-data",
      trace: "test-trace-id",
    });

    expect(config.headers).toEqual({
      Authorization: "Bearer test-token",
      "X-ADAPI-AccessToken": "api-token",
      "X-Forwarded-For": "192.168.1.1",
      "di-persistent-session-id": "persistent-123",
      "Session-Id": "session-123",
      "User-Language": "en",
      "Client-Session-Id": "client-123",
      "txma-audit-encoded": "audit-data",
    });

    expect(config.trace).toBe("test-trace-id");
  });

  it("excludes X-ADAPI-AccessToken when accountDataApiAccessToken is not provided", () => {
    const config = getRequestConfig({
      token: "test-token",
      sourceIp: "192.168.1.1",
      persistentSessionId: "persistent-123",
      sessionId: "session-123",
      userLanguage: "en",
      clientSessionId: "client-123",
      txmaAuditEncoded: "audit-data",
    });

    expect(config.headers).toEqual({
      Authorization: "Bearer test-token",
      "X-Forwarded-For": "192.168.1.1",
      "di-persistent-session-id": "persistent-123",
      "Session-Id": "session-123",
      "User-Language": "en",
      "Client-Session-Id": "client-123",
      "txma-audit-encoded": "audit-data",
    });
    expect(config.headers).not.toHaveProperty("X-ADAPI-AccessToken");
  });
});

describe("getRequestConfigFromExpress", () => {
  let req: Partial<Request>;
  let res: Partial<ExpressResponse>;

  beforeEach(() => {
    req = new RequestBuilder().build();
    res = new ResponseBuilder().build();
    res.locals = {
      ...res.locals,
      trace: "test-trace-id",
    };

    vi.spyOn(oidcModule, "refreshToken").mockImplementation(async () => {});
    vi.spyOn(txmaHeaderModule, "getTxmaHeader").mockReturnValue(
      "txma-audit-encoded"
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the expected request config including tracking trace strings", async () => {
    (req.session as any).user.tokens = {
      accessToken: "token",
      accountDataApiAccessToken: "accountDataApiAccessToken",
    } as any;

    const requestConfig = await getRequestConfigFromExpress(
      req as Request,
      res as ExpressResponse
    );

    expect(requestConfig).toEqual({
      token: "token",
      accountDataApiAccessToken: "accountDataApiAccessToken",
      clientSessionId: "clientsessionid",
      persistentSessionId: "persistentsessionid",
      sessionId: "sessionid",
      sourceIp: "sourceip",
      txmaAuditEncoded: "txma-audit-encoded",
      userLanguage: "en",
      trace: "test-trace-id",
    });
  });

  it("calls refreshToken before building config", async () => {
    (req.session as any).user.tokens = { accessToken: "token" } as any;
    const refreshTokenSpy = vi.spyOn(oidcModule, "refreshToken");

    await getRequestConfigFromExpress(req as Request, res as ExpressResponse);

    expect(refreshTokenSpy).toHaveBeenCalledWith(req);
  });
});

describe("Http", () => {
  const MOCK_TRACE = "mocktracefortesting123";

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoggerError.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  describe("handleError", () => {
    const createMockErrorResponse = (status: number, textBody: string) => {
      return {
        status,
        statusText: "Bad Request",
        headers: {
          entries: vi.fn().mockReturnValue([["x-test-header", "value"]]),
        },
        text: vi.fn().mockResolvedValue(textBody),
      } as unknown as Response;
    };

    it("creates ApiError extracting response data stream", async () => {
      const payload = { code: 1044, message: "Error payload" };
      const mockResponse = createMockErrorResponse(
        HTTP_STATUS_CODES.BAD_REQUEST,
        JSON.stringify(payload)
      );

      const errorPromise = (Http as any).handleError(
        mockResponse,
        "http://example.com",
        "POST",
        MOCK_TRACE
      );

      await expect(errorPromise).rejects.toBeInstanceOf(ApiError);

      expect(mockLoggerError).toHaveBeenCalledWith(
        {
          trace: MOCK_TRACE,
          url: "http://example.com",
          method: "POST",
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          statusText: "Bad Request",
          responseData: payload,
          headers: { "x-test-header": "value" },
        },
        "[POST] http://example.com failed with status 400"
      );
    });

    it("creates ApiError safely", async () => {
      const mockResponse = {
        status: 500,
        statusText: "Internal Server Error",
        headers: {
          entries: vi.fn().mockReturnValue([]),
        },
        text: vi.fn().mockRejectedValue(new Error("Stream crashed")),
      } as unknown as Response;

      const errorPromise = (Http as any).handleError(
        mockResponse,
        "http://example.com",
        "GET",
        MOCK_TRACE
      );

      await expect(errorPromise).rejects.toBeInstanceOf(ApiError);

      expect(mockLoggerError).toHaveBeenCalledWith(
        {
          trace: MOCK_TRACE,
          url: "http://example.com",
          method: "GET",
          status: 500,
          statusText: "Internal Server Error",
          responseData: "",
          headers: {},
        },
        "[GET] http://example.com failed with status 500"
      );
    });
  });

  describe("handleNetworkError", () => {
    it("handles AbortError", () => {
      const abortError = {
        name: "AbortError",
        message: "The operation was aborted",
      };

      expect(() => {
        (Http as any).handleNetworkError(
          abortError,
          "http://example.com",
          "POST",
          MOCK_TRACE
        );
      }).toThrow(ApiError);

      expect(mockLoggerError).toHaveBeenCalledWith(
        {
          trace: MOCK_TRACE,
          url: "http://example.com",
          method: "POST",
          timeout: 10000,
          errorType: "TimeoutError",
        },
        "Timeout: [POST] http://example.com exceeded 10000ms"
      );
    });

    it("handles generic exceptions", () => {
      const genericError = new Error("Connection refused");

      expect(() => {
        (Http as any).handleNetworkError(
          genericError,
          "http://example.com",
          "GET",
          MOCK_TRACE
        );
      }).toThrow("Connection refused");

      expect(mockLoggerError).toHaveBeenCalledWith(
        {
          trace: MOCK_TRACE,
          url: "http://example.com",
          method: "GET",
          errorMessage: "Connection refused",
          errorStack: genericError.stack,
          errorType: "NetworkError",
        },
        "Error: [GET] http://example.com failed with message Connection refused"
      );
    });
  });
});
