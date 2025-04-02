import { expect } from "chai";
import { describe } from "mocha";
import sinon from "sinon";

import { Http } from "../../../src/utils/http";
import { MfaClient, buildResponse } from "../../../src/utils/mfaClient";
import { MfaMethod, SmsMethod } from "../../../src/utils/mfaClient/types";
import { getRequestConfig } from "../../../src/utils/http";
import { AxiosInstance, AxiosResponse } from "axios";
import { ProblemDetail, ValidationProblem } from "../../../src/utils/mfa/types";

const mfaMethod: MfaMethod = {
  mfaIdentifier: "1234",
  methodVerified: true,
  method: {
    type: "SMS",
    phoneNumber: "123456789",
  } as SmsMethod,
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

      const response = await client.retrieve();
      expect(response.data.length).to.eq(1);
    });

    it("should include the publicSubjectId in the URL", async () => {
      const getStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.get = getStub;

      await client.retrieve();
      expect(getStub.calledWith("/mfa-methods/publicSubjectId")).to.be.true;
    });

    it("passes through the status and problem for a non-successful request", async () => {
      const problem: ProblemDetail = { title: "user not found" };
      const getStub = sinon.stub().resolves({ data: problem, status: 404 });
      axiosStub.get = getStub;

      const response = await client.retrieve();
      expect(response.success).to.be.false;
      expect(response.status).to.eq(404);
      expect(response.problem?.title).to.eq(problem.title);
    });
  });

  describe("create", () => {
    it("should POST to the endpoint", async () => {
      const postStub = sinon.stub().resolves({ data: mfaMethod });
      axiosStub.post = postStub;

      const response = await client.create({
        type: "SMS",
        phoneNumber: "123456",
      } as SmsMethod);

      expect(response.data).to.eq(mfaMethod);
      expect(postStub.calledOnce).to.be.true;
    });
  });

  describe("update", () => {
    it("should PUT to the endpoint", async () => {
      const putStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.put = putStub;

      const response = await client.update(mfaMethod);

      expect(response.data.length).to.eq(1);
      expect(response.data[0]).to.eq(mfaMethod);
      expect(putStub.calledOnce).to.be.true;
    });

    it("should include the MFA id in the URL", async () => {
      const putStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.put = putStub;

      await client.update(mfaMethod);

      expect(putStub.calledWith("/mfa-methods/publicSubjectId/1234")).to.be
        .true;
    });
  });

  describe("delete", () => {
    it("should DELETE to the endpoint", async () => {
      const deleteStub = sinon.stub().resolves({ status: 204, data: null });
      axiosStub.delete = deleteStub;

      await client.delete(mfaMethod);

      expect(deleteStub.calledOnce).to.be.true;
    });

    it("should include the MFA id in the URL", async () => {
      const deleteStub = sinon.stub().resolves({ status: 204, data: null });
      axiosStub.delete = deleteStub;

      await client.delete(mfaMethod);

      expect(deleteStub.calledWith("/mfa-methods/publicSubjectId/1234")).to.be
        .true;
    });
  });
});

describe("buildRequest", () => {
  it("returns the data when response status is 200", () => {
    const response = {
      status: 200,
      data: mfaMethod,
    } as AxiosResponse<MfaMethod>;

    const apiResponse = buildResponse(response);

    expect(response.status).to.eq(apiResponse.status);
    expect(apiResponse.success).to.be.true;
    expect(apiResponse.data).to.eq(mfaMethod);
  });

  it("returns success when response status is 204", () => {
    const response = {
      status: 204,
    } as AxiosResponse;

    const apiResponse = buildResponse(response);

    expect(apiResponse.success).to.be.true;
  });

  it("returns a ValidationProblem when response status is 400", () => {
    const response = {
      status: 400,
      data: {
        type: "Validation Problem",
        title: "Title",
        errors: [{ detail: "error detail", pointer: "error pointer" }],
      } as ValidationProblem,
    } as AxiosResponse;

    const apiResponse = buildResponse(response);

    expect(apiResponse.status).to.eq(400);
    expect(apiResponse.success).to.be.false;
    expect(apiResponse.problem).to.eq(response.data);
  });
});
