import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  AxiosResponse,
  AxiosRequestHeaders,
} from "axios";
import { ApiResponseResult } from "../utils/types";
import { getApiBaseUrl } from "../config";
import { HTTP_STATUS_CODES } from "../app.constants";
import { ApiError } from "./errors";

const headers: AxiosRequestHeaders = {
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

export function getRequestConfig(
  token: string,
  validationStatues?: number[],
  sourceIp?: string
): AxiosRequestConfig {
  const config: AxiosRequestConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    proxy: false,
  };

  if (validationStatues) {
    config.validateStatus = function (status: number) {
      return validationStatues.includes(status);
    };
  }

  if (sourceIp) {
    config.headers["X-Forwarded-For"] = sourceIp;
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
    let apiError;

    if (error.response && error.response.data) {
      apiError = new ApiError(
        error.message,
        error.response.status,
        error.response.data
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
