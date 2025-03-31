import { AxiosRequestConfig } from "axios";
import { Http } from "../http";
import { getMfaServiceUrl } from "../../config";

import { Method, MfaClientInterface, MfaMethod } from "./types";

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
    this.http = http ? http : new Http(getMfaServiceUrl());
  }

  async retrieve() {
    const response = await this.http.client.get<MfaMethod[]>(
      `/mfa-methods/${this.publicSubjectId}`,
      this.requestConfig
    );

    return response.data;
  }

  async create(method: Method) {
    const response = await this.http.client.post<MfaMethod>(
      `/mfa-methods/${this.publicSubjectId}`,
      { priorityIdentifier: "DEFAULT", method: method },
      this.requestConfig
    );

    return response.data;
  }
  async update(method: MfaMethod) {
    const response = await this.http.client.put<MfaMethod[]>(
      `/mfa-methods/${this.publicSubjectId}/${method.mfaIdentifier}`,
      { mfaMethod: method },
      this.requestConfig
    );

    return response.data;
  }
  // delete() {}
}
