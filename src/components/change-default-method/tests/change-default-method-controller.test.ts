import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";

import { changeDefaultMfaMethodPost } from "../change-default-method-controller";
import * as mfa from "../../../utils/mfa";
import * as mfaCommon from "../../common/mfa";
import { UpdateInformationSessionValues } from "../../../utils/types";

describe.only("change default method", () => {
  let sandbox: sinon.SinonSandbox;

  const statusFn = sinon.spy();
  const redirectFn = sinon.spy();
  const changeFn = sinon.spy();

  const generateRequest = (id: string) => {
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
            switchBackupMethod: {
              value: "CHANGE_VALUE",
            },
          },
        },
      },
      body: { newDefault: id },
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
    sandbox.replace(mfa, "changeDefaultMfaMethod", changeFn);
    sandbox.replace(mfaCommon, "generateSessionDetails", () => {
      return Promise.resolve({} as UpdateInformationSessionValues);
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should change the DEFAULT MFA method", async () => {
    const req = generateRequest("1");
    const res = generateResponse();

    //@ts-expect-error req and res aren't valid objects since they are mocked
    await changeDefaultMfaMethodPost(req as Request, res as Response);

    expect(changeFn).to.be.calledWith(1);
    expect(redirectFn).to.be.calledWith("/switch-method-confirm");
  });
});
