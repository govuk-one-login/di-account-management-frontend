import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import axios, { AxiosError, AxiosResponse } from "axios";
import { RequestBuilder, ResponseBuilder } from "../../../test/utils/builders";
import {
  createApiResponse,
  getRequestConfig,
  getRequestConfigFromExpress,
  Http,
} from "../http.js";
import { HTTP_STATUS_CODES } from "../../app.constants.js";
import { ApiError } from "../errors.js";
import * as oidcModule from "../oidc.js";
import * as txmaHeaderModule from "../txma-header.js";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("createApiResponse", () => {
  it("returns success true when status is in default success statuses", () => {
    const response = {
      status: HTTP_STATUS_CODES.OK,
      data: { code: 0, message: "Success" },
    } as AxiosResponse;

    const result = createApiResponse(response);

    expect(result).toEqual({
      success: true,
      code: 0,
      message: "Success",
    });
  });

  it("returns success false when status is not in success statuses", () => {
    const response = {
      status: HTTP_STATUS_CODES.BAD_REQUEST,
      data: { code: 1, message: "Error" },
    } as AxiosResponse;

    const result = createApiResponse(response);

    expect(result).toEqual({
      success: false,
      code: 1,
      message: "Error",
    });
  });

  it("uses custom status codes when provided", () => {
    const response = {
      status: HTTP_STATUS_CODES.BAD_REQUEST,
      data: { code: 1, message: "Error" },
    } as AxiosResponse;

    const result = createApiResponse(response, [HTTP_STATUS_CODES.BAD_REQUEST]);

    expect(result).toEqual({
      success: true,
      code: 1,
      message: "Error",
    });
  });
});

describe("getRequestConfig", () => {
  it("returns basic config with required headers", () => {
    const config = getRequestConfig({
      token: "test-token",
      accountDataApiToken: "api-token",
    });

    expect(config).toEqual({
      headers: {
        Authorization: "Bearer test-token",
        "X-ADAPI-AccessToken": "api-token",
      },
      proxy: false,
    });
  });

  it("returns config without X-ADAPI-AccessToken when accountDataApiToken is not provided", () => {
    const config = getRequestConfig({
      token: "test-token",
    });

    expect(config).toEqual({
      headers: {
        Authorization: "Bearer test-token",
      },
      proxy: false,
    });
  });

  it("includes validation statuses when provided", () => {
    const validationStatuses = [200, 400];
    const config = getRequestConfig({
      token: "test-token",
      validationStatuses,
    });

    expect(config.validateStatus).toBeDefined();
    expect(config.validateStatus!(200)).toBe(true);
    expect(config.validateStatus!(400)).toBe(true);
    expect(config.validateStatus!(500)).toBe(false);
  });

  it("includes optional headers when provided", () => {
    const config = getRequestConfig({
      token: "test-token",
      accountDataApiToken: "api-token",
      sourceIp: "192.168.1.1",
      persistentSessionId: "persistent-123",
      sessionId: "session-123",
      userLanguage: "en",
      clientSessionId: "client-123",
      txmaAuditEncoded: "audit-data",
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
  });

  it("excludes X-ADAPI-AccessToken when accountDataApiToken is not provided", () => {
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
  let res: Partial<Response>;

  beforeEach(() => {
    req = new RequestBuilder().build();
    res = new ResponseBuilder().build();
    vi.spyOn(oidcModule, "refreshToken").mockImplementation(async () => {});
    vi.spyOn(txmaHeaderModule, "getTxmaHeader").mockReturnValue(
      "txma-audit-encoded"
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the expected request config", async () => {
    (req.session as any).user.tokens = { accessToken: "token" } as any;

    const requestConfig = await getRequestConfigFromExpress(
      req as Request,
      res as Response
    );

    expect(requestConfig).toEqual({
      token: "token",
      accountDataApiToken: "TODO",
      clientSessionId: "clientsessionid",
      persistentSessionId: "persistentsessionid",
      sessionId: "sessionid",
      sourceIp: "sourceip",
      txmaAuditEncoded: "txma-audit-encoded",
      userLanguage: "en",
    });
  });

  it("calls refreshToken before building config", async () => {
    (req.session as any).user.tokens = { accessToken: "token" } as any;
    const refreshTokenSpy = vi.spyOn(oidcModule, "refreshToken");

    await getRequestConfigFromExpress(req as Request, res as Response);

    expect(refreshTokenSpy).toHaveBeenCalledWith(req);
  });
});

describe("Http", () => {
  let http: Http;
  const mockAxiosInstance = {
    create: vi.fn(),
    interceptors: {
      response: {
        use: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.create = vi.fn().mockReturnValue(mockAxiosInstance);
  });

  describe("constructor", () => {
    it("creates Http instance with baseUrl", () => {
      http = new Http("http://example.com");
      expect(http).toBeInstanceOf(Http);
    });

    it("accepts optional axios instance", () => {
      const customInstance = {} as any;
      http = new Http("http://example.com", customInstance);
      expect(http.client).toBe(customInstance);
    });
  });

  describe("client getter", () => {
    it("returns provided instance when available", () => {
      const customInstance = {} as any;
      http = new Http("http://example.com", customInstance);
      expect(http.client).toBe(customInstance);
    });

    it("initializes new instance when none provided", () => {
      http = new Http("http://example.com");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const client = http.client; // Access the client to trigger initialization

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "http://example.com",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Credentials": "true",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe("handleError", () => {
    it("creates ApiError with response data when available", async () => {
      const axiosError = {
        message: "Request failed",
        response: {
          status: 400,
          data: "Error details",
        },
      } as AxiosError;

      const result = (Http as any).handleError(axiosError);

      await expect(result).rejects.toBeInstanceOf(ApiError);
    });

    it("creates ApiError with just message when no response data", async () => {
      const axiosError = {
        message: "Network error",
      } as AxiosError;

      const result = (Http as any).handleError(axiosError);

      await expect(result).rejects.toBeInstanceOf(ApiError);
    });
  });
});
