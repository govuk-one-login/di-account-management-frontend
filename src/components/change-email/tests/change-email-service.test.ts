import { sinon } from "../../../../test/utils/test-utils";
import { changeEmailService } from "../change-email-service";
import { expect } from "chai";
import { NOTIFICATION_TYPE } from "../../../app.constants";
import axios, { AxiosError, AxiosInstance, AxiosRequestHeaders } from "axios";
import { ApiError } from "../../../utils/errors";

const headers: AxiosRequestHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Credentials": "true",
  "X-Requested-With": "XMLHttpRequest",
};

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

const http = new Http("getApiBaseUrl()");
describe.only("changeEmailService", () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    sandbox.restore();
  });

  it("send Code verification Notification", async () => {
    // const headers: AxiosRequestHeaders = {
    //   Accept: "application/json",
    //   "Content-Type": "application/json; charset=utf-8",
    //   "Access-Control-Allow-Credentials": "true",
    //   "X-Requested-With": "XMLHttpRequest",
    // };
    //const fakeHttp = sinon.createStubInstance(http.client);

    //const fakeHttp = sinon.stub(http.client.prototype, "post");
    // const status = Promise.resolve(HTTP_STATUS_CODES.NO_CONTENT);
    // {
    //   axios.create({
    //     baseURL: "baseurl",
    //     headers: headers,
    //   });
    // const new_http = new Http("baseUrl");

    //const fakeHttp = sinon.stub(http, "client");

    const accessToken = "1234";
    const email = "something@test.com";
    const sourceIp = "0.0.0.0";
    const sessionId = "session-123";
    const persistentSessionId = "persistentsession123";
    const userLanguage = "en";

    const sendCodeVerificationNotification = changeEmailService(
      http
    ).sendCodeVerificationNotification(
      accessToken,
      email,
      NOTIFICATION_TYPE.VERIFY_EMAIL,
      sourceIp,
      sessionId,
      persistentSessionId,
      userLanguage
    );
    console.log(JSON.stringify(sendCodeVerificationNotification));
    //expect(fakeHttp.client.post).to.have.been.calledOnce;
    expect(sendCodeVerificationNotification).to.true;
  });
});
