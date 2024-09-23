import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";

import {
  switchBackupMfaMethodPost,
  switchBackupMfaMethodGet,
} from "../switch-backup-method-controller";
import * as mfa from "../../../utils/mfa";
import * as mfaCommon from "../../common/mfa";
import { UpdateInformationSessionValues } from "../../../utils/types";

describe("change default method", () => {
  let sandbox: sinon.SinonSandbox;

  const statusFn = sinon.spy();
  const redirectFn = sinon.spy();
  const changeFn = sinon.spy();

  const generateRequest = (id: string, noBackup = true, noDefault = true) => {
    const mfaMethods: any[] = [];
    if (!noBackup) {
      mfaMethods.push({
        mfaIdentifier: 1,
        priorityIdentifier: "BACKUP",
        method: {
          mfaMethodType: "AUTH_APP",
        },
      });
    }
    if (!noDefault) {
      mfaMethods.push({
        mfaIdentifier: 2,
        priorityIdentifier: "DEFAULT",
        method: {
          mfaMethodType: "SMS",
          phoneNumber: "12345678",
        },
      });
    }
    return {
      session: {
        mfaMethods,
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

  describe("GET", () => {
    it("should return a 404 if there is no backup method", async () => {
      const req = generateRequest("1", true);
      const res = generateResponse();

      //@ts-expect-error req and res aren't valid objects since they are mocked
      await switchBackupMfaMethodGet(req as Request, res as Response);

      expect(statusFn).to.be.calledWith(404);
    });

    it("should return a 404 if there is no default method", async () => {
      const req = generateRequest("1", false, true);
      const res = generateResponse();

      //@ts-expect-error req and res aren't valid objects since they are mocked
      await switchBackupMfaMethodGet(req as Request, res as Response);

      expect(statusFn).to.be.calledWith(404);
    });
  });

  describe("POST", () => {
    it("should change the DEFAULT MFA method", async () => {
      const req = generateRequest("1", false);
      const res = generateResponse();

      //@ts-expect-error req and res aren't valid objects since they are mocked
      await switchBackupMfaMethodPost(req as Request, res as Response);

      expect(changeFn).to.be.calledWith(1);
      expect(redirectFn).to.be.calledWith("/switch-methods-confirmation");
    });

    it("should return a 404 if the new defualt method doesn't exist", async () => {
      const req = generateRequest("5", false);
      const res = generateResponse();

      //@ts-expect-error req and res aren't valid objects since they are mocked
      await switchBackupMfaMethodPost(req as Request, res as Response);

      expect(statusFn).to.be.calledWith(404);
    });

    it("should return a 500 if there is an error when changing the defualt method", async () => {
      sandbox.restore();
      sandbox.replace(mfa, "changeDefaultMfaMethod", () => {
        throw Error("error!");
      });
      sandbox.replace(mfaCommon, "generateSessionDetails", () => {
        return Promise.resolve({} as UpdateInformationSessionValues);
      });

      const req = generateRequest("1", false);
      const res = generateResponse();

      //@ts-expect-error req and res aren't valid objects since they are mocked
      await switchBackupMfaMethodPost(req as Request, res as Response);

      expect(statusFn).to.be.calledWith(500);
    });
  });
});
