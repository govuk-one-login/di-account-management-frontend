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
  const axiosStub = {} as AxiosInstance;
  let client: MfaClient;

  beforeEach(() => {
    client = new MfaClient(
      "publicSubjectId",
      getRequestConfig({ token: "token" }),
      new Http("http://example.com", axiosStub)
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("retrieve", () => {
    it("should return a list of MfaMethods", async () => {
      const getStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.get = getStub;

      const methods = await client.retrieve();
      expect(methods.length).to.eq(1);
    });

    it("should include the publicSubjectId in the URL", async () => {
      const getStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.get = getStub;

      await client.retrieve();
      expect(
        getStub.calledWith("http://example.com/mfa-methods/publicSubjectId`")
      );
    });
  });

  describe("create", () => {
    it("should POST to the endpoint", async () => {
      const postStub = sinon.stub().resolves({ data: mfaMethod });
      axiosStub.post = postStub;

      const method = await client.create({
        type: "SMS",
        phoneNumber: "123456",
      } as smsMethod);

      expect(method == mfaMethod);
      expect(postStub.calledOnce);
    });
  });

  describe("update", () => {
    it("should PUT to the endpoint", async () => {
      const putStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.put = putStub;

      const methods = await client.update(mfaMethod);

      expect(methods.length).to.eq(1);
      expect(methods[0] == mfaMethod);
      expect(putStub.calledOnce);
    });

    it("should include the MFA id in the URL", async () => {
      const putStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.put = putStub;

      await client.update(mfaMethod);

      expect(
        putStub.calledWith(
          "http://example.com/mfa-methods/publicSubjectId/1234"
        )
      );
    });
  });
});
