import { Request, Response as ExpressResponse } from "express";
import {
  getRequestConfig,
  getRequestConfigFromExpress,
  Http,
  FetchRequestConfig,
} from "../http.js";
import { getMfaServiceUrl } from "../../config.js";

import {
  ApiResponse,
  SmsMethod,
  AuthAppMethod,
  MfaClientInterface,
  MfaMethod,
  CreateMfaPayload,
  SimpleError,
  UpdateMfaPayload,
  Passkey,
} from "./types.js";
import { HTTP_STATUS_CODES } from "../../app.constants.js";
import { validateCreate, validateUpdate } from "./validate.js";

export class MfaClient implements MfaClientInterface {
  private readonly publicSubjectId: string;
  private readonly requestConfig: FetchRequestConfig;
  private readonly http: Http;

  constructor(
    publicSubjectId: string,
    requestConfig: FetchRequestConfig,
    http?: Http
  ) {
    this.requestConfig = requestConfig;
    this.publicSubjectId = publicSubjectId;
    this.http = http || new Http(getMfaServiceUrl());
  }

  async retrieve() {
    const response = await this.http.get(
      `/mfa-methods/${this.publicSubjectId}`,
      this.requestConfig
    );

    return buildResponse<MfaMethod[]>(response);
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

    const response = await this.http.post(
      `/mfa-methods/${this.publicSubjectId}`,
      { mfaMethod: payload },
      this.requestConfig
    );

    return buildResponse<MfaMethod>(response);
  }

  async update(method: MfaMethod, otp?: string) {
    validateUpdate(method, otp);

    const payload: UpdateMfaPayload = {
      ...method,
    };

    if (otp) {
      payload.method.otp = otp;
    }

    const response = await this.http.put(
      `/mfa-methods/${this.publicSubjectId}/${method.mfaIdentifier}`,
      { mfaMethod: method },
      this.requestConfig
    );

    return buildResponse<MfaMethod[]>(response);
  }

  async delete(method: MfaMethod) {
    const response = await this.http.delete(
      `/mfa-methods/${this.publicSubjectId}/${method.mfaIdentifier}`,
      this.requestConfig
    );

    return buildResponse<void>(response);
  }

  async makeDefault(mfaIdentifier: string) {
    const response = await this.http.put(
      `/mfa-methods/${this.publicSubjectId}/${mfaIdentifier}`,
      { mfaMethod: { priorityIdentifier: "DEFAULT" } },
      this.requestConfig
    );

    return buildResponse<MfaMethod[]>(response);
  }

  async getPasskeys() {
    const response = await this.http.get(
      `/passkeys/${this.publicSubjectId}`,
      this.requestConfig
    );

    return buildResponse<{ passkeys: Passkey[] }>(response);
  }

  async deletePasskey(id: string) {
    const response = await this.http.delete(
      `/passkeys/${this.publicSubjectId}/${id}`,
      this.requestConfig
    );

    return buildResponse<void>(response);
  }
}

export async function buildResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  const { status } = response;
  const success =
    status === HTTP_STATUS_CODES.OK || status === HTTP_STATUS_CODES.NO_CONTENT;

  let data: any = null;

  if (status !== HTTP_STATUS_CODES.NO_CONTENT) {
    try {
      data = await response.json();
    } catch {
      try {
        data = await response.text();
      } catch {
        data = null;
      }
    }
  }

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
  res: ExpressResponse
): Promise<MfaClient> {
  const expressConfig = await getRequestConfigFromExpress(req, res);

  return new MfaClient(
    req.session.user?.publicSubjectId,
    getRequestConfig({
      ...expressConfig,
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
  return `${prefix}. Status code: ${response.status}, API error code: ${response.error?.code}, API error message: ${response.error?.message}`;
}
