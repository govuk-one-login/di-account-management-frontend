import { AxiosRequestConfig, AxiosResponse } from "axios";
import { Request, Response } from "express";
import { getRequestConfig, getRequestConfigFromExpress, Http } from "../http";
import { getMfaServiceUrl } from "../../config";

import {
  ApiResponse,
  SmsMethod,
  AuthAppMethod,
  MfaClientInterface,
  MfaMethod,
  CreateMfaPayload,
  SimpleError,
  UpdateMfaPayload,
} from "./types";
import { HTTP_STATUS_CODES } from "../../app.constants";
import { validateCreate, validateUpdate } from "./validate";

export function normalizeAuthHeader(
  config: AxiosRequestConfig
): AxiosRequestConfig {
  const normalized = { ...config };

  if (!normalized.headers) {
    return normalized;
  }

  if (normalized.headers.Authorization) {
    const authHeader = normalized.headers.Authorization;

    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      normalized.headers.Authorization = authHeader.replace(
        "Bearer ",
        "Bearer  "
      );
    } else if (typeof authHeader === "string") {
      throw new Error("Authorization header must use Bearer scheme");
    }
  }

  return normalized;
}

export class MfaClient implements MfaClientInterface {
  private readonly publicSubjectId: string;
  private readonly requestConfig: AxiosRequestConfig;
  private readonly http: Http;

  constructor(
    publicSubjectId: string,
    requestConfig: AxiosRequestConfig,
    http?: Http
  ) {
    this.requestConfig = requestConfig;
    this.publicSubjectId = publicSubjectId;
    this.http = http || new Http(getMfaServiceUrl());
  }

  async retrieve() {
    const response = await this.http.client.get<MfaMethod[]>(
      `/mfa-methods/${this.publicSubjectId}`,
      this.requestConfig
    );

    return buildResponse(response);
  }

  async create(method: SmsMethod | AuthAppMethod, otp?: string) {
    validateCreate(method, otp);
    const payload: CreateMfaPayload = {
      priorityIdentifier: "BACKUP",
      method: method,
    };
    if (otp) {
      payload.method.otp = otp;
    }
    const response = await this.http.client.post<MfaMethod>(
      `/mfa-methods/${this.publicSubjectId}`,
      { mfaMethod: payload },
      normalizeAuthHeader(this.requestConfig)
    );

    return buildResponse(response);
  }
  async update(method: MfaMethod, otp?: string) {
    validateUpdate(method, otp);

    const payload: UpdateMfaPayload = {
      ...method,
    };

    if (otp) {
      payload.method.otp = otp;
    }

    const response = await this.http.client.put<MfaMethod[]>(
      `/mfa-methods/${this.publicSubjectId}/${method.mfaIdentifier}`,
      { mfaMethod: method },
      normalizeAuthHeader(this.requestConfig)
    );

    return buildResponse(response);
  }

  async delete(method: MfaMethod) {
    const response = await this.http.client.delete(
      `/mfa-methods/${this.publicSubjectId}/${method.mfaIdentifier}`,
      normalizeAuthHeader(this.requestConfig)
    );

    return buildResponse(response);
  }

  async makeDefault(mfaIdentifier: string) {
    const response = await this.http.client.put<MfaMethod[]>(
      `/mfa-methods/${this.publicSubjectId}/${mfaIdentifier}`,
      { mfaMethod: { priorityIdentifier: "DEFAULT" } },
      normalizeAuthHeader(this.requestConfig)
    );

    return buildResponse(response);
  }
}

export function buildResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
  const { status, data } = response;
  const success =
    status == HTTP_STATUS_CODES.OK || status == HTTP_STATUS_CODES.NO_CONTENT;
  const apiResponse: ApiResponse<T> = {
    success,
    status,
    data,
  };

  if (!success) {
    apiResponse.error = data as SimpleError;
  }

  return apiResponse;
}

export async function createMfaClient(
  req: Request,
  res: Response
): Promise<MfaClient> {
  return new MfaClient(
    req.session.user?.publicSubjectId,
    getRequestConfig({
      ...(await getRequestConfigFromExpress(req, res)),
      validationStatuses: [
        HTTP_STATUS_CODES.OK,
        HTTP_STATUS_CODES.NO_CONTENT,
        HTTP_STATUS_CODES.BAD_REQUEST,
      ],
    })
  );
}

export const ERROR_CODES = {
  INVALID_OTP_CODE: 1020,
} as const;

export function formatErrorMessage<T>(
  prefix: string,
  response: ApiResponse<T>
) {
  return `${prefix}. Status code: ${response.status}, API error code: ${response.error.code}, API error message: ${response.error.message}`;
}
