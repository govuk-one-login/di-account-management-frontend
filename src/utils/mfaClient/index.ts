import { AxiosRequestConfig } from "axios";
import { Http } from "../http";
import { getMfaServiceUrl } from "../../config";

import { MfaClientInterface, MfaMethod } from "./types";

export default class MfaClient implements MfaClientInterface {
  private readonly publicSubjectId: string;
  private readonly requestConfig: AxiosRequestConfig;
  private readonly http: Http;

  constructor(publicSubjectId: string, requestConfig: AxiosRequestConfig) {
    this.requestConfig = requestConfig;
    this.publicSubjectId = publicSubjectId;
    this.http = new Http(getMfaServiceUrl());
  }

  retrieve() {
    const methods: MfaMethod[] = [];
    return methods;
  }
  // create(method: Method) {}
  // update() {}
  // delete() {}
}
