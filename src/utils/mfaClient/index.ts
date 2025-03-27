import { AxiosRequestConfig } from "axios";
import { Http } from "../http";
import { getMfaServiceUrl } from "../../config";

import { MfaClientInterface, MfaMethod } from "./types";

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
  // create(method: Method) {}
  // update() {}
  // delete() {}
}
