import { AxiosRequestConfig, AxiosResponse } from "axios";
import { Http } from "../http";
import { getMfaServiceUrl } from "../../config";
import { ProblemDetail, ValidationProblem } from "../mfa/types";

import { ApiResponse, Method, MfaClientInterface, MfaMethod } from "./types";
import { HTTP_STATUS_CODES } from "../../app.constants";

export default class MfaClient implements MfaClientInterface {
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

  async create(method: Method) {
    const response = await this.http.client.post<MfaMethod>(
      `/mfa-methods/${this.publicSubjectId}`,
      { priorityIdentifier: "DEFAULT", method: method },
      this.requestConfig
    );

    return buildResponse(response);
  }
  async update(method: MfaMethod) {
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
}

export function buildResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
  const { status, data } = response;
  const success =
    status == HTTP_STATUS_CODES.OK || status == HTTP_STATUS_CODES.NO_CONTENT;

  if (success) {
    return {
      success,
      status,
      data,
    };
  } else {
    let problem: ValidationProblem | ProblemDetail;

    if (status == HTTP_STATUS_CODES.BAD_REQUEST) {
      problem = data as ValidationProblem;
    } else {
      problem = data as ProblemDetail;
    }
    return {
      status,
      success,
      data,
      problem,
    };
  }
}
