import { expect } from "chai";
import { describe, it } from "mocha";
import { Request, Response } from "express";
import { SinonSandbox } from "sinon";
import { sinon } from "../../../../test/utils/test-utils";

import { chooseBackupGet, chooseBackupPost } from "../choose-backup-controller";
import { PATH_DATA } from "../../../app.constants";
import { EventType } from "../../../utils/state-machine";

describe("addBackupGet", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: {
        user: { state: { addBackup: { value: EventType.Authenticated } } },
        mfaMethods: [],
      } as any,
      cookies: { lng: "en" },
      i18n: { language: "en" },
      t: sandbox.fake(),
      log: { error: sandbox.fake() },
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      locals: {},
      status: sandbox.stub().returnsThis() as sinon.SinonStub<
        [number],
        Response
      >,
      end: sandbox.stub().returnsThis(),
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should add mfa method page", () => {
    chooseBackupGet(req as Request, res as Response);

    expect(res.render).to.have.calledWith("choose-backup/index.njk");
  });

  it("should handle a single mfa method", () => {
    req.session.mfaMethods = [
      {
        mfaIdentifier: "111111",
        methodVerified: true,
        method: {
          credential: "ABC",
          mfaMethodType: "AUTH_APP",
        },
        priorityIdentifier: "DEFAULT",
      },
    ];
    chooseBackupGet(req as Request, res as Response);

    expect(res.render).to.have.calledWith("choose-backup/index.njk", {
      mfaMethods: [],
      showSingleMethod: true,
      oplValues: {
        contentId: "63f44ae6-46f1-46c3-a2e8-305fe2ddf27d",
        taxonomyLevel2: "Home",
        taxonomyLevel3: "MFA Method Management",
      },
    });
  });

  it("should handle two mfa methods", () => {
    req.session.mfaMethods = [
      {
        mfaIdentifier: "111111",
        methodVerified: true,
        method: {
          phoneNumber: "070",
          mfaMethodType: "SMS",
        },
        priorityIdentifier: "DEFAULT",
      },
      {
        mfaIdentifier: "2222",
        methodVerified: true,
        method: {
          phoneNumber: "070",
          mfaMethodType: "SMS",
        },
        priorityIdentifier: "BACKUP",
      },
    ];
    chooseBackupGet(req as Request, res as Response);

    expect(res.render).to.have.calledWith("choose-backup/index.njk", {
      mfaMethods: req.session.mfaMethods,
      oplValues: undefined,
    });
  });

  it("should handle mor than two mfa methods", () => {
    req.session.mfaMethods = [
      {
        mfaIdentifier: "111111",
        methodVerified: true,
        method: {
          phoneNumber: "070",
          mfaMethodType: "SMS",
        },
        priorityIdentifier: "DEFAULT",
      },
      {
        mfaIdentifier: "22222",
        methodVerified: true,
        method: {
          phoneNumber: "070",
          mfaMethodType: "SMS",
        },
        priorityIdentifier: "BACKUP",
      },
      {
        mfaIdentifier: "33333",
        methodVerified: true,
        method: {
          phoneNumber: "070",
          mfaMethodType: "SMS",
        },
        priorityIdentifier: "BACKUP",
      },
    ];
    chooseBackupGet(req as Request, res as Response);

    expect(res.status).to.have.calledWith(500);
  });
});

describe("addBackupPost", () => {
  let sandbox: SinonSandbox;
  let req: any;
  let res: Partial<Response>;
  let next: sinon.SinonSpy;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    const endFake = sandbox.fake(
      (chunk?: any, encoding?: any, cb?: () => void) => {
        if (typeof chunk === "function") {
          // Called as end(cb)
          chunk();
        } else if (typeof encoding === "function") {
          // Called as end(chunk, cb)
          encoding();
        } else if (cb) {
          // Called as end(chunk, encoding, cb)
          cb();
        }
        return {} as Response; // You should return a proper type here, matching your test environment needs
      }
    );
    req = {
      body: {},
      log: { error: sandbox.fake() } as any,
      session: {
        user: { state: { addBackup: { value: "SMS" } } },
      } as any,
    };
    res = {
      status: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      end: endFake,
    } as Partial<Response>;
    next = sinon.spy();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should take the use to the add backup phone number page when that option is selected", () => {
    req.body.addBackup = "sms";

    chooseBackupPost(req as Request, res as Response, next);

    expect(res.redirect).to.have.been.calledWith(
      PATH_DATA.ADD_MFA_METHOD_SMS.url
    );
  });

  it("should take the user to the add auth app page when the user selects that option", () => {
    req.body.addBackup = "app";

    chooseBackupPost(req as Request, res as Response, next);

    expect(res.redirect).to.have.been.calledWith(
      PATH_DATA.ADD_MFA_METHOD_APP.url
    );
  });

  it("should call next with an error when addBackup is unknown", () => {
    req.body.addBackup = "unknown";

    chooseBackupPost(req as Request, res as Response, next);

    const call: sinon.SinonSpyCall<Error[], unknown> = next.getCall(0);

    expect(call.args[0].message).to.equal("Unknown addBackup: unknown");
  });
});
