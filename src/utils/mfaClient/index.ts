import { AxiosRequestConfig, AxiosResponse } from "axios";
import { Request, Response } from "express";
import { getRequestConfig, Http } from "../http";
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
import { getTxmaHeader } from "../txma-header";
import { validateCreate, validateUpdate } from "./validate";

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
      this.requestConfig
    );

    return buildResponse(response);
  }
  async update(method: MfaMethod, otp?: string) {
    validateUpdate(method, otp);

    const payload: UpdateMfaPayload = {
      ...method,
    };

    if (otp) {
      payload.otp = otp;
    }

    const response = await this.http.client.put<MfaMethod[]>(
      `/mfa-methods/${this.publicSubjectId}/${method.mfaIdentifier}`,
      { mfaMethod: method },
      this.requestConfig
    );

    return buildResponse(response);
  }

  async delete(method: MfaMethod) {
    const response = await this.http.client.delete(
      `/mfa-methods/${this.publicSubjectId}/${method.mfaIdentifier}`,
      this.requestConfig
    );

    return buildResponse(response);
  }

  async makeDefault(method: MfaMethod) {
    const newMfaMethod: MfaMethod = {
      mfaIdentifier: method.mfaIdentifier,
      methodVerified: method.methodVerified,
      priorityIdentifier: "DEFAULT",
      method: method.method,
    };

    return this.update(newMfaMethod);
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

export function createMfaClient(req: Request, res: Response): MfaClient {
  return new MfaClient(
    req.session.user?.publicSubjectId,
    getRequestConfig({
      token: req.session.user.tokens.accessToken,
      sourceIp: req.ip,
      persistentSessionId: res.locals.persistentSessionId,
      sessionId: res.locals.sessionId,
      clientSessionId: res.locals.clientSessionId,
      txmaAuditEncoded: getTxmaHeader(req, res.locals.trace),
    })
  );
}

export function formatErrorMessage<T>(
  prefix: string,
  response: ApiResponse<T>
) {
  return `${prefix}. Status code: ${response.status}, API error code: ${response.error.code}, API error message: ${response.error.message}`;
}
