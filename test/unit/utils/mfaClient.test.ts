import { expect } from "chai";
import { describe } from "mocha";
import sinon from "sinon";

import { Http } from "../../../src/utils/http";
import MfaClient from "../../../src/utils/mfaClient";
import { MfaMethod, smsMethod } from "../../../src/utils/mfaClient/types";
import { getRequestConfig } from "../../../src/utils/http";
import { AxiosInstance } from "axios";

const mfaMethod: MfaMethod = {
  mfaIdentifier: "1234",
  methodVerified: true,
  method: {
    type: "SMS",
    phoneNumber: "123456789",
  } as smsMethod,
  priorityIdentifier: "DEFAULT",
};

describe("MfaClient", () => {
  let axiosStub: sinon.SinonStub;
  let client: MfaClient;
  const requestConfig = getRequestConfig({ token: "token" });

  beforeEach(() => {
    axiosStub = sinon.stub();

    client = new MfaClient(
      "publicSubjectId",
      requestConfig,
      new Http("http://example.com", axiosStub as unknown as AxiosInstance)
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("retrieve", () => {
    it("should return a list of MfaMethods", async () => {
      axiosStub.get = sinon.stub().resolves({ data: [mfaMethod] });

      const methods = await client.retrieve();
      expect(methods.length).to.eq(1);
    });

    it("should include the publicSubjectId in the URL", async () => {
      const getStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.get = getStub;

      await client.retrieve();
      getStub.calledWith("http://example.com/mfa-methods/publicSubjectId`");
    });
  });
});
