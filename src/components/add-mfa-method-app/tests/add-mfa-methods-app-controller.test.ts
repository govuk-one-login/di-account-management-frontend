import { expect } from "chai";
import { describe, it } from "mocha";
import { Request, Response } from "express";
import { SinonSandbox } from "sinon";
import { sinon } from "../../../../test/utils/test-utils";

import {
  addMfaAppMethodGet,
  addMfaAppMethodPost,
} from "../add-mfa-method-app-controller";
import { PATH_DATA } from "../../../app.constants";
import * as mfaModule from "../../../utils/mfa";
import QRCode from "qrcode";
import { MfaClient } from "../../../utils/mfaClient";
import { AuthAppMethod, MfaMethod } from "../../../utils/mfaClient/types";
import * as mfaClient from "../../../utils/mfaClient";

describe("addMfaAppMethodGet", () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should render the add app page", async () => {
    const req = {
      session: { user: { email: "test@test.com" } },
      body: {},
      log: { error: sinon.fake() },
    };
    const res = {
      render: sinon.fake(),
    };
    const next = sinon.spy();

    sandbox.replace(mfaModule, "generateMfaSecret", () => "A".repeat(20));
    sandbox.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

    await addMfaAppMethodGet(
      req as unknown as Request,
      res as unknown as Response,
      next
    );

    expect(res.render).to.have.been.calledWith("add-mfa-method-app/index.njk", {
      authAppSecret: "A".repeat(20),
      qrCode: await QRCode.toDataURL("qrcode"),
      formattedSecret: "AAAA AAAA AAAA AAAA AAAA",
      backLink: undefined,
      errors: undefined,
      errorList: undefined,
    });
  });

  it("should return an error if there is no email in the session", async () => {
    const req = {
      session: { user: {} },
      log: { error: sinon.fake() },
    };
    const res = {};
    const next = sinon.spy();

    await addMfaAppMethodGet(
      req as unknown as Request,
      res as unknown as Response,
      next
    );

    expect(next).to.have.been.calledWith(sinon.match.instanceOf(Error));
  });
});

describe("addMfaAppMethodPost", () => {
  let mfaClientStub: sinon.SinonStubbedInstance<MfaClient>;
  let nextSpy: sinon.SinonSpy;
  let logSpy: sinon.SinonSpy;

  const appMethod: AuthAppMethod = {
    type: "AUTH_APP",
    credential: "1234567890",
  };

  const mfaMethod: MfaMethod = {
    mfaIdentifier: "1",
    priorityIdentifier: "BACKUP",
    methodVerified: true,
    method: appMethod,
  };

  beforeEach(() => {
    mfaClientStub = sinon.createStubInstance(MfaClient);
    sinon.stub(mfaClient, "createMfaClient").returns(mfaClientStub);
    nextSpy = sinon.spy();
    logSpy = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should redirect to add mfa app confirmation page when successful", async () => {
    const req = {
      body: {
        code: "123456",
        authAppSecret: appMethod.credential,
      },
      session: { user: { state: { addBackup: { value: "APP" } } } },
      log: { error: logSpy },
      t: (t: string) => t,
    };

    const res = { redirect: sinon.fake(() => {}) };

    sinon.replace(mfaModule, "verifyMfaCode", () => true);
    mfaClientStub.create.resolves({
      success: true,
      status: 200,
      data: mfaMethod,
    });

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      nextSpy
    );

    expect(mfaClientStub.create).to.have.been.calledWith(appMethod);

    expect(res.redirect).to.have.been.calledWith(
      PATH_DATA.ADD_MFA_METHOD_APP_CONFIRMATION.url
    );
  });

  it("should render an error if the code is invalid", async () => {
    const req = {
      body: {
        code: "123456",
        authAppSecret: appMethod.credential,
      },
      session: { user: { state: { addBackup: { value: "APP" } } } },
      log: { error: logSpy },
    };
    const res = { render: sinon.fake() };

    sinon.replace(mfaModule, "verifyMfaCode", () => false);

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      nextSpy
    );

    expect(mfaClientStub.create).not.to.have.been.called;
  });
});
