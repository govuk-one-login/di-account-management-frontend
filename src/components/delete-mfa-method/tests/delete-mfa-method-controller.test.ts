import { expect } from "chai";
import { describe } from "mocha";

import { deleteMfaMethodPost } from "../delete-mfa-method-controller";
import { Request } from "express";
import { sinon } from "../../../../test/utils/test-utils";
import * as mfa from "../../../utils/mfa";
import * as mfaCommon from "../../common/mfa";
import { UpdateInformationSessionValues } from "../../../utils/types";

describe("delete mfa method controller", () => {
  let sandbox: sinon.SinonSandbox;

  const statusFn = sinon.spy();
  const removeFn = sinon.spy();
  const redirectFn = sinon.spy();

  const generateRequest = (idToRemove: string) => {
    return {
      session: {
        mfaMethods: [
          {
            mfaIdentifier: 1,
            priorityIdentifier: "BACKUP",
          },
        ],
        user: {
          state: {
            removeMfaMethod: {
              value: "CHANGE_VALUE",
            },
          },
        },
      },
      body: { methodId: idToRemove },
    };
  };
  const generateResponse = () => {
    return {
      status: statusFn,
      session: {},
      redirect: redirectFn,
    };
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.replace(mfa, "removeMfaMethod", removeFn);
    sandbox.replace(mfaCommon, "generateSessionDetails", () => {
      return Promise.resolve({} as UpdateInformationSessionValues);
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should delete an MFA method", async () => {
    const req = generateRequest("1");
    const res = generateResponse();

    //@ts-expect-error req and res aren't valid objects since they are mocked
    await deleteMfaMethodPost(req as Request, res as Response);

    expect(removeFn).to.be.calledWith(1);
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
