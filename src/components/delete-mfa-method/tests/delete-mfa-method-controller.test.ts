import { expect } from "chai";
import { describe } from "mocha";

import { deleteMfaMethodPost } from "../delete-mfa-method-controller";
import { Request } from "express";
import { sinon } from "../../../../test/utils/test-utils";
import MfaClient from "../../../utils/mfaClient";
import { MfaMethod, SmsMethod } from "../../../utils/mfaClient/types";
import * as http from "../../../utils/http";
import * as txma from "../../../utils/txma-header";
import * as mfaClient from "../../../utils/mfaClient";

describe("delete mfa method controller", () => {
  const statusFn = sinon.spy();
  const redirectFn = sinon.spy();

  let mfaClientStub: sinon.SinonStubbedInstance<MfaClient>;

  const mfaMethod: MfaMethod = {
    mfaIdentifier: "1",
    priorityIdentifier: "BACKUP",
    methodVerified: true,
    method: { type: "SMS", phoneNumber: "1234567890" } as SmsMethod,
  };

  const generateRequest = (idToRemove: string) => {
    return {
      session: {
        mfaMethods: [mfaMethod],
        user: {
          state: {
            removeMfaMethod: {
              value: "CHANGE_VALUE",
            },
          },
          tokens: {
            accessToken: "accessToken",
          },
        },
      },
      body: { methodId: idToRemove },
      ip: "ip",
    };
  };
  const generateResponse = () => {
    return {
      status: statusFn,
      session: {},
      redirect: redirectFn,
      locals: {
        sessionId: "sessionId",
        clientSessionId: "clientSessionId",
        persistentSessionId: "persistentSessionId",
      },
    };
  };

  beforeEach(() => {
    mfaClientStub = sinon.createStubInstance(MfaClient);
    sinon.replace(http, "getRequestConfig", sinon.stub().returns({}));
    sinon.replace(txma, "getTxmaHeader", sinon.stub().returns("txmaHeader"));
    sinon.stub(mfaClient, "default").returns(mfaClientStub);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should delete an MFA method", async () => {
    const req = generateRequest("1");
    const res = generateResponse();

    //@ts-expect-error req and res aren't valid objects since they are mocked
    await deleteMfaMethodPost(req as Request, res as Response);

    expect(mfaClientStub.delete).to.be.calledWith(mfaMethod);
    expect(redirectFn).to.be.calledWith("/remove-backup-confirmation");
  });

  it("should return a 404 if a non existant method is tried", async () => {
    const req = generateRequest("2");
    const res = generateResponse();

    //@ts-expect-error req and res aren't valid objects since they are mocked
    await deleteMfaMethodPost(req as Request, res as Response);

    expect(statusFn).to.be.calledWith(404);
  });
});
