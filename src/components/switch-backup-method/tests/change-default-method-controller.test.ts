import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import { SinonSpy } from "sinon";

import {
  switchBackupMfaMethodPost,
  switchBackupMfaMethodGet,
} from "../switch-backup-method-controller";
import * as mfaClient from "../../../utils/mfaClient";
import { AuthAppMethod, MfaMethod } from "../../../utils/mfaClient/types";

describe("change default method", () => {
  const statusFn = sinon.spy();
  const redirectFn = sinon.spy();

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
      locals: {},
    };
  };

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
    let mockEventService: {
      buildAuditEvent: SinonSpy;
      send: SinonSpy;
    };
    let mfaClientStub: sinon.SinonStubbedInstance<mfaClient.MfaClient>;
    const appMethod: AuthAppMethod = {
      mfaMethodType: "AUTH_APP",
      credential: "1234567890",
    };

    const mfaMethod: MfaMethod = {
      mfaIdentifier: "1",
      priorityIdentifier: "BACKUP",
      methodVerified: true,
      method: appMethod,
    };

    beforeEach(async () => {
      mfaClientStub = sinon.createStubInstance(mfaClient.MfaClient);
      sinon.stub(mfaClient, "createMfaClient").returns(mfaClientStub);

      mockEventService = {
        buildAuditEvent: sinon.fake.returns({ event: "test-event" }),
        send: sinon.fake(),
      };
      const eventServiceStub = sinon.stub().returns(mockEventService);
      const eventServiceModule = await import(
        "../../../services/event-service"
      );
      sinon
        .stub(eventServiceModule, "eventService")
        .get(() => eventServiceStub);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should change the DEFAULT MFA method", async () => {
      const req = {
        session: {
          mfaMethods: [
            mfaMethod,
            { ...mfaMethod, priorityIdentifier: "DEFAULT", mfaIdentifier: "2" },
          ],
          user: {
            state: {
              switchBackupMethod: {
                value: "CHANGE_VALUE",
              },
            },
          },
        },
        body: { newDefault: mfaMethod.mfaIdentifier },
      };
      const res = generateResponse();

      mfaClientStub.makeDefault.resolves({
        data: [mfaMethod],
        success: true,
        status: 200,
      });

      //@ts-expect-error req and res aren't valid objects since they are mocked
      await switchBackupMfaMethodPost(req as Request, res as Response);

      expect(mfaClientStub.makeDefault).to.be.calledWith(
        mfaMethod.mfaIdentifier
      );
      expect(redirectFn).to.be.calledWith("/switch-methods-confirmation");
    });

    it("should send an AUTH_MFA_METHOD_SWITCH_STARTED audit event upon success", async () => {
      const req = {
        session: {
          mfaMethods: [
            mfaMethod,
            { ...mfaMethod, priorityIdentifier: "DEFAULT", mfaIdentifier: "2" },
          ],
          user: {
            state: {
              switchBackupMethod: {
                value: "CHANGE_VALUE",
              },
            },
          },
        },
        body: { newDefault: mfaMethod.mfaIdentifier },
      };
      const res = generateResponse();

      mfaClientStub.makeDefault.resolves({
        data: [mfaMethod],
        success: true,
        status: 200,
      });

      //@ts-expect-error req and res aren't valid objects since they are mocked
      await switchBackupMfaMethodPost(req as Request, res as Response);

      expect(mockEventService.buildAuditEvent).to.have.been.calledWith(
        req,
        res,
        "AUTH_MFA_METHOD_SWITCH_COMPLETED"
      );
      expect(mockEventService.send).to.have.been.calledOnce;

      expect(mfaClientStub.makeDefault).to.be.calledWith(
        mfaMethod.mfaIdentifier
      );
      expect(redirectFn).to.be.calledWith("/switch-methods-confirmation");
    });

    it("should return a 404 if the new default method doesn't exist", async () => {
      const req = generateRequest("5", false);
      const res = generateResponse();

      //@ts-expect-error req and res aren't valid objects since they are mocked
      await switchBackupMfaMethodPost(req as Request, res as Response);

      expect(statusFn).to.be.calledWith(404);
      expect(mockEventService.send).not.to.have.been.called;
    });

    it("should return a 500 if the request to the API fails", async () => {
      mfaClientStub.makeDefault.resolves({
        data: [mfaMethod],
        success: false,
        status: 500,
        error: { message: "Internal server error", code: 1 },
      });

      const req = generateRequest("1", false);
      const res = generateResponse();

      //@ts-expect-error req and res aren't valid objects since they are mocked
      await switchBackupMfaMethodPost(req as Request, res as Response);

      expect(statusFn).to.be.calledWith(500);
      expect(mockEventService.send).not.to.have.been.called;
    });
  });
});
