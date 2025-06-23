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
import { EventName, HTTP_STATUS_CODES } from "../../app.constants";
import { validateCreate, validateUpdate } from "./validate";
import { eventService } from "../../services/event-service";

export class MfaClient implements MfaClientInterface {
  private readonly publicSubjectId: string;
  private readonly requestConfig: AxiosRequestConfig;
  private readonly http: Http;
  private readonly req: Request;
  private readonly res: Response;

  constructor(
    req: Request,
    res: Response,
    requestConfig: AxiosRequestConfig,
    http?: Http
  ) {
    this.requestConfig = requestConfig;
    this.publicSubjectId = req.session.user?.publicSubjectId;
    this.http = http || new Http(getMfaServiceUrl());
    this.req = req;
    this.res = res;
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

    const builtResponse = buildResponse(response);

    if (builtResponse.success) {
      const service = eventService();
      const audit_event = service.buildAuditEvent(
        this.req,
        this.res,
        EventName.AUTH_MFA_METHOD_ADD_COMPLETED
      );
      const trace = this.res.locals.sessionId;
      service.send(audit_event, trace);
    }

    return builtResponse;
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

  async makeDefault(mfaIdentifier: string) {
    const response = await this.http.client.put<MfaMethod[]>(
      `/mfa-methods/${this.publicSubjectId}/${mfaIdentifier}`,
      { mfaMethod: { priorityIdentifier: "DEFAULT" } },
      this.requestConfig
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

export function createMfaClient(req: Request, res: Response): MfaClient {
  return new MfaClient(
    req,
    res,
    getRequestConfig({
      ...getRequestConfigFromExpress(req, res),
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
