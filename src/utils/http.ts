import { ApiResponseResult } from "./types.js";
import { getApiBaseUrl } from "../config.js";
import { HTTP_STATUS_CODES } from "../app.constants.js";
import { ApiError } from "./errors.js";
import { Request, Response as ExpressResponse } from "express";
import xss from "xss";
import { getTxmaHeader } from "./txma-header.js";
import { refreshToken } from "./oidc.js";
import { logger } from "./logger.js";

const headers: Record<string, string> = {
  Accept: "application/json",
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Credentials": "true",
  "X-Requested-With": "XMLHttpRequest",
};

interface FetchResponseData {
  code?: string;
  message?: string;
}

export async function createApiResponse(
  response: Response,
  status: number[] = [HTTP_STATUS_CODES.OK, HTTP_STATUS_CODES.NO_CONTENT],
  trace?: string
): Promise<ApiResponseResult> {
  const isSuccess = status.includes(response.status);

  if (
    response.status === HTTP_STATUS_CODES.NO_CONTENT ||
    response.headers.get("content-length") === "0"
  ) {
    return {
      success: isSuccess,
      code: response.status,
      message: isSuccess ? "Success" : "No content returned",
    };
  }

  try {
    const data = (await response.json()) as FetchResponseData;
    return {
      success: isSuccess,
      code:
        data.code !== undefined &&
        data.code !== null &&
        !Number.isNaN(Number(data.code))
          ? Number(data.code)
          : response.status,
      message: data.message || "",
    };
  } catch (error) {
    logger.error(
      {
        trace,
        status: response.status,
        statusText: response.statusText,
        error: error instanceof Error ? error.message : String(error),
      },
      `createApiResponse parsing failure for response with status ${response.status}`
    );

    return {
      success: false,
      code: response.status,
      message: `Invalid server response (${response.statusText})`,
    };
  }
}

export interface RequestConfig {
  token: string;
  accountDataApiAccessToken?: string;
  validationStatuses?: number[];
  sourceIp?: string;
  persistentSessionId?: string;
  sessionId?: string;
  userLanguage?: string;
  clientSessionId?: string;
  txmaAuditEncoded?: string;
  trace?: string;
}

export async function getRequestConfigFromExpress(
  req: Request,
  res: ExpressResponse
): Promise<Parameters<typeof getRequestConfig>[0]> {
  await refreshToken(req);

  return {
    token: req.session.user.tokens.accessToken,
    accountDataApiAccessToken:
      req.session.user.tokens.accountDataApiAccessToken,
    sourceIp: req.ip,
    sessionId: res.locals.sessionId,
    persistentSessionId: res.locals.persistentSessionId,
    userLanguage: xss(req.cookies.lng as string),
    clientSessionId: res.locals.clientSessionId,
    txmaAuditEncoded: getTxmaHeader(req, res.locals.trace),
    trace: res.locals.trace,
  };
}

export interface FetchRequestConfig extends RequestInit {
  validateStatus?: (status: number) => boolean;
  trace?: string;
}

export function getRequestConfig({
  token,
  accountDataApiAccessToken,
  validationStatuses,
  sourceIp,
  persistentSessionId,
  sessionId,
  userLanguage,
  clientSessionId,
  txmaAuditEncoded,
  trace,
}: RequestConfig): FetchRequestConfig {
  const config: FetchRequestConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    trace,
  };

  const configHeaders = config.headers as Record<string, string>;

  if (accountDataApiAccessToken) {
    configHeaders["X-ADAPI-AccessToken"] = accountDataApiAccessToken;
  }

  if (validationStatuses) {
    config.validateStatus = function (status: number) {
      return validationStatuses.includes(status);
    };
  }

  if (sourceIp) {
    configHeaders["X-Forwarded-For"] = sourceIp;
  }

  if (persistentSessionId) {
    configHeaders["di-persistent-session-id"] = persistentSessionId;
  }

  if (sessionId) {
    configHeaders["Session-Id"] = sessionId;
  }

  if (userLanguage) {
    configHeaders["User-Language"] = userLanguage;
  }

  if (clientSessionId) {
    configHeaders["Client-Session-Id"] = clientSessionId;
  }

  if (txmaAuditEncoded) {
    configHeaders["txma-audit-encoded"] = txmaAuditEncoded;
  }

  return config;
}

export class Http {
  private readonly baseUrl: string;
  private readonly defaultTimeout = 10000;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request(
    endpoint: string,
    options: FetchRequestConfig = {}
  ): Promise<Response> {
    const urlIsAbsolute =
      endpoint.startsWith("http://") || endpoint.startsWith("https://");

    const relativeEndpoint = endpoint.startsWith("/")
      ? `${this.baseUrl}${endpoint}`
      : `${this.baseUrl}/${endpoint}`;
    const url = urlIsAbsolute ? endpoint : relativeEndpoint;
    const method = options.method || "GET";
    const mergedHeaders = {
      ...headers,
      ...(options.headers as Record<string, string>),
    };

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.defaultTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: mergedHeaders,
        signal: controller.signal,
      });

      clearTimeout(id);

      const isValidStatus = options.validateStatus
        ? options.validateStatus(response.status)
        : response.ok;

      if (!isValidStatus) {
        return await Http.handleError(response, url, method, options.trace);
      }

      return response;
    } catch (error: any) {
      clearTimeout(id);
      return Http.handleNetworkError(error, url, method, options.trace);
    }
  }

  private static async handleError(
    response: Response,
    url: string,
    method: string,
    trace?: string
  ): Promise<never> {
    let bodyText = "";
    let structuredPayload: any = null;

    try {
      bodyText = await response.text();
      if (bodyText && bodyText.trim() !== "") {
        structuredPayload = JSON.parse(bodyText);
      }
    } catch {
      structuredPayload = bodyText;
    }

    logger.error(
      {
        trace,
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        responseData: structuredPayload,
        headers: Object.fromEntries(response.headers.entries()),
      },
      `[${method}] ${url} failed with status ${response.status}`
    );

    throw new ApiError(
      `Request failed with status code ${response.status}`,
      response.status,
      bodyText
    );
  }

  private static handleNetworkError(
    error: any,
    url: string,
    method: string,
    trace?: string
  ): never {
    if (error.name === "AbortError") {
      logger.error(
        {
          trace,
          url,
          method,
          timeout: 10000,
          errorType: "TimeoutError",
        },
        `Timeout: [${method}] ${url} exceeded 10000ms`
      );
      throw new ApiError("The request timed out", 408);
    }

    logger.error(
      {
        trace,
        url,
        method,
        errorMessage: error.message,
        errorStack: error.stack,
        errorType: "NetworkError",
      },
      `Error: [${method}] ${url} failed with message ${error.message}`
    );

    throw new ApiError(error.message || "Network Error");
  }

  async get(endpoint: string, options?: FetchRequestConfig): Promise<Response> {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  async post(
    endpoint: string,
    body?: any,
    options?: FetchRequestConfig
  ): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: body && typeof body !== "string" ? JSON.stringify(body) : body,
    });
  }

  async put(
    endpoint: string,
    body?: any,
    options?: FetchRequestConfig
  ): Promise<Response> {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: body && typeof body !== "string" ? JSON.stringify(body) : body,
    });
  }

  async delete(
    endpoint: string,
    options?: FetchRequestConfig
  ): Promise<Response> {
    return this.request(endpoint, { ...options, method: "DELETE" });
  }
}

export const http = new Http(getApiBaseUrl());
