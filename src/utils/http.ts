import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  AxiosResponse,
  RawAxiosRequestHeaders,
} from "axios";
import { ApiResponseResult } from "./types";
import { getApiBaseUrl } from "../config";
import { HTTP_STATUS_CODES } from "../app.constants";
import { ApiError } from "./errors";

const headers: RawAxiosRequestHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Credentials": "true",
  "X-Requested-With": "XMLHttpRequest",
};

export function createApiResponse(
  response: AxiosResponse,
  status: number[] = [HTTP_STATUS_CODES.OK, HTTP_STATUS_CODES.NO_CONTENT]
): ApiResponseResult {
  return {
    success: status.includes(response.status),
    code: response.data.code,
    message: response.data.message,
  };
}

export function getRequestConfig({
  token,
  validationStatuses,
  sourceIp,
  persistentSessionId,
  sessionId,
  userLanguage,
  clientSessionId,
  txmaAuditEncoded,
}: {
  token: string;
  validationStatuses?: number[];
  sourceIp?: string;
  persistentSessionId?: string;
  sessionId?: string;
  userLanguage?: string;
  clientSessionId?: string;
  txmaAuditEncoded?: string;
}): AxiosRequestConfig {
  const config: AxiosRequestConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    proxy: false,
  };

  if (validationStatuses) {
    config.validateStatus = function (status: number) {
      return validationStatuses.includes(status);
    };
  }

  if (sourceIp) {
    config.headers["X-Forwarded-For"] = sourceIp;
  }

  if (persistentSessionId) {
    config.headers["di-persistent-session-id"] = persistentSessionId;
  }

  if (sessionId) {
    config.headers["Session-Id"] = sessionId;
  }

  if (userLanguage) {
    config.headers["User-Language"] = userLanguage;
  }

  if (clientSessionId) {
    config.headers["Client-Session-Id"] = clientSessionId;
  }

  if (txmaAuditEncoded) {
    config.headers["txma-audit-encoded"] = txmaAuditEncoded;
  }

  return config;
}

export class Http {
  private instance: AxiosInstance;
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  get client(): AxiosInstance {
    return this.instance || this.initHttp();
  }

  private static handleError(error: AxiosError) {
    let apiError: ApiError;

    if (error?.response?.data) {
      apiError = new ApiError(
        error.message,
        error.response.status,
        error.response.data as string
      );
    } else {
      apiError = new ApiError(error.message);
    }

    return Promise.reject(apiError);
  }

  private initHttp() {
    const http = axios.create({
      baseURL: this.baseUrl,
      headers: headers,
    });

    http.interceptors.response.use(
      (response) => response,
      (error) => Http.handleError(error)
    );

    this.instance = http;
    return http;
  }
}

export const http = new Http(getApiBaseUrl());
