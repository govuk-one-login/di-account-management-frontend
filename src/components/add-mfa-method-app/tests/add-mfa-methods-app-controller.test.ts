import { expect } from "chai";
import { describe, it } from "mocha";
import { Request, Response } from "express";
import { SinonSandbox } from "sinon";
import { sinon } from "../../../../test/utils/test-utils";

import {
  addMfaAppMethodGet,
  addMfaMethodGoBackGet,
  addMfaAppMethodPost,
} from "../add-mfa-method-app-controller";
import { PATH_DATA } from "../../../app.constants";
import * as mfaModule from "../../../utils/mfa";
import QRCode from "qrcode";
import { MfaClient } from "../../../utils/mfaClient";
import { AuthAppMethod, MfaMethod } from "../../../utils/mfaClient/types";
import * as mfaClient from "../../../utils/mfaClient";

describe("addMfaMethodGoBackGet", () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should redirect to the method selection page", async () => {
    const req = {
      session: {
        user: { state: { addBackup: { value: "APP" } } },
      },
    };
    const res = { redirect: sinon.fake(() => {}) };

    await addMfaMethodGoBackGet(
      req as unknown as Request,
      res as unknown as Response
    );

    expect(res.redirect).to.have.been.calledWith(PATH_DATA.ADD_MFA_METHOD.url);
  });
});

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
      session: {
        user: { email: "test@test.com" },
      },
      body: {},
      log: { error: sinon.fake() },
    };
    const res = {
      render: sinon.fake(),
      locals: {},
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
      backLink: "/back-from-set-up-method",
      errors: undefined,
      errorList: undefined,
    });
  });

  it("should return an error if there is no email in the session", async () => {
    const req = {
      session: { user: {} },
      log: { error: sinon.fake() },
    };
    const res = {
      locals: {},
    };
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
    mfaMethodType: "AUTH_APP",
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
    sinon.stub(mfaClient, "createMfaClient").resolves(mfaClientStub);
    nextSpy = sinon.spy();
    logSpy = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should redirect to 'Your services' when the user has the max number of MFA methods'", async () => {
    const req = {
      body: {
        code: "123456",
        authAppSecret: appMethod.credential,
      },
      session: {
        user: { state: { addBackup: { value: "APP" } } },
        mfaMethods: [
          {
            mfaIdentifier: "1",
            priorityIdentifier: "DEFAULT",
            method: { mfaMethodType: "SMS", phoneNumber: "0123456789" },
            methodVerified: true,
          },
          {
            mfaIdentifier: "2",
            priorityIdentifier: "BACKUP",
            method: { mfaMethodType: "AUTH_APP", credential: "abc123" },
            methodVerified: true,
          },
        ],
      },
      log: { error: logSpy },
      t: (t: string) => t,
    };

    const res = { redirect: sinon.fake(() => {}), locals: {} };

    sinon.replace(mfaModule, "verifyMfaCode", async () => true);
    sinon.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      nextSpy
    );

    expect(mfaClientStub.create).not.to.have.been.called;

    expect(res.redirect).to.have.been.calledWith(PATH_DATA.SECURITY.url);
  });

  it("should redirect to add mfa app confirmation page when successful", async () => {
    const req = {
      body: {
        code: "123456",
        authAppSecret: appMethod.credential,
      },
      session: {
        user: { state: { addBackup: { value: "APP" } } },
        mfaMethods: [] as MfaMethod[],
      },
      log: { error: logSpy },
      t: (t: string) => t,
    };

    const res = { redirect: sinon.fake(() => {}), locals: {} };

    sinon.replace(mfaModule, "verifyMfaCode", async () => true);
    sinon.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

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
      session: {
        user: { state: { addBackup: { value: "APP" } }, email: "email" },
        mfaMethods: [] as MfaMethod[],
      },
      log: { error: logSpy },
      t: (s: string) => s,
    };
    const res = { render: sinon.fake(), locals: {} };

    sinon.replace(mfaModule, "verifyMfaCode", async () => false);
    sinon.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      nextSpy
    );

    expect(mfaClientStub.create).not.to.have.been.called;
    expect(res.render).to.have.been.calledWith("add-mfa-method-app/index.njk", {
      authAppSecret: "1234567890",
      qrCode: await QRCode.toDataURL("qrcode"),
      formattedSecret: "1234 5678 90",
      backLink: "/back-from-set-up-method",
      errors: {
        code: { text: "setUpAuthApp.errors.invalidCode", href: "#code" },
      },
      errorList: [{ text: "setUpAuthApp.errors.invalidCode", href: "#code" }],
    });
  });

  it("should render an error if the code is missing", async () => {
    const req = {
      body: {
        authAppSecret: appMethod.credential,
      },
      session: {
        user: { state: { addBackup: { value: "APP" } }, email: "email" },
        mfaMethods: [] as MfaMethod[],
      },
      log: { error: logSpy },
      t: (s: string) => s,
    };
    const res = { render: sinon.fake(), locals: {} };

    sinon.replace(mfaModule, "verifyMfaCode", async () => true);
    sinon.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      nextSpy
    );

    expect(mfaClientStub.create).not.to.have.been.called;
    expect(res.render).to.have.been.calledWith("add-mfa-method-app/index.njk", {
      authAppSecret: "1234567890",
      qrCode: await QRCode.toDataURL("qrcode"),
      formattedSecret: "1234 5678 90",
      backLink: "/back-from-set-up-method",
      errors: {
        code: { text: "setUpAuthApp.errors.required", href: "#code" },
      },
      errorList: [{ text: "setUpAuthApp.errors.required", href: "#code" }],
    });
  });

  it("should render an error if the code has letters", async () => {
    const req = {
      body: {
        code: "abc123",
        authAppSecret: appMethod.credential,
      },
      session: {
        user: { state: { addBackup: { value: "APP" } }, email: "email" },
        mfaMethods: [] as MfaMethod[],
      },
      log: { error: logSpy },
      t: (s: string) => s,
    };
    const res = { render: sinon.fake(), locals: {} };

    sinon.replace(mfaModule, "verifyMfaCode", async () => true);
    sinon.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      nextSpy
    );

    expect(mfaClientStub.create).not.to.have.been.called;
    expect(res.render).to.have.been.calledWith("add-mfa-method-app/index.njk", {
      authAppSecret: "1234567890",
      qrCode: await QRCode.toDataURL("qrcode"),
      formattedSecret: "1234 5678 90",
      backLink: "/back-from-set-up-method",
      errors: {
        code: {
          text: "setUpAuthApp.errors.invalidFormat",
          href: "#code",
        },
      },
      errorList: [{ text: "setUpAuthApp.errors.invalidFormat", href: "#code" }],
    });
  });

  it("should render an error if the code is longer than 6 digits", async () => {
    const req = {
      body: {
        code: "1234567",
        authAppSecret: appMethod.credential,
      },
      session: {
        user: { state: { addBackup: { value: "APP" } }, email: "email" },
        mfaMethods: [] as MfaMethod[],
      },
      log: { error: logSpy },
      t: (s: string) => s,
    };
    const res = { render: sinon.fake(), locals: {} };

    sinon.replace(mfaModule, "verifyMfaCode", async () => true);
    sinon.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      nextSpy
    );

    expect(mfaClientStub.create).not.to.have.been.called;
    expect(res.render).to.have.been.calledWith("add-mfa-method-app/index.njk", {
      authAppSecret: "1234567890",
      qrCode: await QRCode.toDataURL("qrcode"),
      formattedSecret: "1234 5678 90",
      backLink: "/back-from-set-up-method",
      errors: {
        code: { text: "setUpAuthApp.errors.maxLength", href: "#code" },
      },
      errorList: [{ text: "setUpAuthApp.errors.maxLength", href: "#code" }],
    });
  });

  it("should log and throw an error if the call to the MFA API fails", async () => {
    const req = {
      body: {
        code: "123456",
        authAppSecret: appMethod.credential,
      },
      session: {
        user: { state: { addBackup: { value: "APP" } } },
        mfaMethods: [] as MfaMethod[],
      },
      log: { error: logSpy },
      t: (t: string) => t,
    };

    const res = { redirect: sinon.fake(() => {}), locals: { trace: "trace" } };

    sinon.replace(mfaModule, "verifyMfaCode", async () => true);
    sinon.replace(mfaModule, "generateQRCodeValue", () => "qrcode");

    mfaClientStub.create.resolves({
      success: false,
      status: 400,
      data: {} as MfaMethod,
      error: {
        code: 1,
        message: "Bad request",
      },
    });

    try {
      await addMfaAppMethodPost(
        req as unknown as Request,
        res as unknown as Response,
        nextSpy
      );
    } catch {
      expect(logSpy.called).to.be.true;
    }
  });
});
