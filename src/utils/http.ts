import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import { getApiBaseUrl } from "../config";
import { logger } from "./logger";

const headers: Readonly<Record<string, string | boolean>> = {
  Accept: "application/json",
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Credentials": true,
  "X-Requested-With": "XMLHttpRequest",
};

export function getBaseRequestConfig(token: string): AxiosRequestConfig {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    proxy: false,
  };
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
    const { response } = error;
    const data = response.data;

    if (data) {
      logger.error(error.message, { error: JSON.stringify(data) });
    } else {
      logger.error(error.message);
    }

    return Promise.reject(error);
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
