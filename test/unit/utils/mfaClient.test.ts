import { expect } from "chai";
import { describe } from "mocha";
import sinon from "sinon";
import { Request, Response } from "express";

import { Http } from "../../../src/utils/http";
import {
  MfaClient,
  buildResponse,
  createMfaClient,
} from "../../../src/utils/mfaClient";
import {
  AuthAppMethod,
  MfaMethod,
  SmsMethod,
} from "../../../src/utils/mfaClient/types";
import { validateCreate } from "../../../src/utils/mfaClient/validate";
import { getRequestConfig } from "../../../src/utils/http";
import { AxiosInstance, AxiosResponse } from "axios";
import { ProblemDetail, ValidationProblem } from "../../../src/utils/mfa/types";

const mfaMethod: MfaMethod = {
  mfaIdentifier: "1234",
  methodVerified: true,
  method: {
    mfaMethodType: "SMS",
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
    it("should POST to the endpoint with an SMS app and an OTP", async () => {
      const postStub = sinon.stub().resolves({ data: mfaMethod });
      axiosStub.post = postStub;

      const response = await client.create(
        {
          mfaMethodType: "SMS",
          phoneNumber: "123456",
        },
        "OTP"
      );

      expect(response.data).to.eq(mfaMethod);
      expect(postStub.calledOnce).to.be.true;
    });

    it("should POST to the endpoint with an auth app and no OTP", async () => {
      const authApp: MfaMethod = {
        mfaIdentifier: "1234",
        methodVerified: true,
        method: {
          mfaMethodType: "AUTH_APP",
          credential: "abc123",
        },
        priorityIdentifier: "DEFAULT",
      };

      const postStub = sinon.stub().resolves({ data: authApp });
      axiosStub.post = postStub;

      const response = await client.create({
        mfaMethodType: "AUTH_APP",
        credential: "123456",
      });

      expect(response.data).to.eq(authApp);
      expect(postStub.calledOnce).to.be.true;
    });

    it("should raise an error with an SMS app and no OTP", async () => {
      const postStub = sinon.stub().resolves({ data: mfaMethod });
      axiosStub.post = postStub;

      expect(
        client.create({
          mfaMethodType: "SMS",
          phoneNumber: "123456",
        })
      ).to.be.rejected;
      expect(postStub.notCalled).to.be.true;
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

  describe("makeDefault", () => {
    it("should PUT to the endpoint", async () => {
      const putStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.put = putStub;

      const response = await client.makeDefault(mfaMethod);

      expect(response.data.length).to.eq(1);
      expect(response.data[0]).to.eq(mfaMethod);
      expect(putStub.calledOnce).to.be.true;
    });

    it("should call the API and change the priority to DEFAULT", async () => {
      const putStub = sinon.stub().resolves({ data: [mfaMethod] });
      axiosStub.put = putStub;

      const backupMethod: MfaMethod = {
        ...mfaMethod,
        priorityIdentifier: "BACKUP",
      };

      await client.makeDefault(backupMethod);

      expect(putStub).to.have.been.calledWith(
        "/mfa-methods/publicSubjectId/1234",
        { mfaMethod }
      );
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

describe("createMfaClient", () => {
  it("creates an MfaClient", () => {
    const req = {
      ip: "ip",
      session: {
        user: {
          publicSubjectId: "publicSubjectId",
          tokens: { accessToken: "accessToken" },
        },
      },
      headers: { "txma-audit-encoded": "auditHeader" },
    };

    const res = {
      locals: {
        sessionId: "sessionId",
        persistentSessionID: "persistentSessionId",
        clientSessionId: "clientSessionId",
        trace: "trace",
      },
    };

    const client = createMfaClient(
      req as unknown as Request,
      res as unknown as Response
    );

    expect(client.retrieve).to.be.a("Function");
    expect(client.create).to.be.a("Function");
    expect(client.update).to.be.a("Function");
    expect(client.delete).to.be.a("Function");
  });
});

describe("validateCreate", () => {
  const smsMethod: SmsMethod = {
    mfaMethodType: "SMS",
    phoneNumber: "0123456789",
  };
  const authAppMethod: AuthAppMethod = {
    mfaMethodType: "AUTH_APP",
    credential: "abc123",
  };

  it("doesn't throw an error with an SMS method and an OTP", () => {
    expect(() => {
      validateCreate(smsMethod, "1234");
    }).not.to.throw();
  });

  it("doesn't throw an error with an auth app method and no OTP", () => {
    expect(() => {
      validateCreate(authAppMethod);
    }).not.to.throw();
  });

  it("throws an error with an auth app method and an OTP", () => {
    expect(() => {
      validateCreate(authAppMethod, "1234");
    }).to.throw("Must not provide OTP when mfaMethodType is AUTH_APP");
  });

  it("throws an error with an SMS method and no OTP", () => {
    expect(() => {
      validateCreate(smsMethod);
    }).to.throw("Must provide OTP when mfaMethodType is SMS");
  });
});
