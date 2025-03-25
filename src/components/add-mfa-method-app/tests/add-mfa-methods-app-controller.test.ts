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
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should redirect to add mfa app confirmation page", async () => {
    const req = {
      headers: {
        "txma-audit-encoded": "txma-audit-encoded",
      },
      body: {
        code: "123456",
        authAppSecret: "A".repeat(20),
      },
      session: {
        id: "session_id",
        user: {
          email: "test@test.com",
          tokens: { accessToken: "token" },
          state: { addMfaMethod: { value: "APP" } },
        },
      },
      log: { error: sinon.fake() },
      ip: "127.0.0.1",
      t: (t: string) => t,
      cookies: {
        lng: "en",
      },
    };
    const res = {
      locals: {
        persistentSessionId: "persistentSessionId",
        clientSessionId: "clientSessionId",
        trace: "trace",
      },
      redirect: sandbox.fake(() => {}),
    };
    const next = sinon.spy();
    const addMfaMethod = sinon.fake.returns(
      Promise.resolve({
        status: 200,
        data: {
          mfaIdentifier: 1,
          methodVerified: true,
          method: {
            mfaMethodType: "AUTH_APP",
          },
          priorityIdentifier: "BACKUP",
        },
      })
    );

    sandbox.replace(mfaModule, "verifyMfaCode", () => true);
    sandbox.replace(
      mfaModule,
      "addMfaMethod",
      addMfaMethod as typeof mfaModule.addMfaMethod
    );

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      next
    );

    expect(addMfaMethod).to.have.been.calledWith(
      {
        email: "test@test.com",
        otp: "123456",
        credential: "AAAAAAAAAAAAAAAAAAAA",
        mfaMethod: {
          priorityIdentifier: "BACKUP",
          method: {
            mfaMethodType: "AUTH_APP",
          },
        },
      },
      {
        accessToken: "token",
        sourceIp: "127.0.0.1",
        sessionId: "session_id",
        persistentSessionId: "persistentSessionId",
        userLanguage: "en",
        clientSessionId: "clientSessionId",
        txmaAuditEncoded: "txma-audit-encoded",
      }
    );

    expect(res.redirect).to.have.been.calledWith(
      PATH_DATA.ADD_MFA_METHOD_APP_CONFIRMATION.url
    );
  });

  it("should render an error if the code is invalid", async () => {
    const req = {
      body: {
        code: "123456",
        authAppSecret: "A".repeat(20),
      },
      session: {
        id: "session_id",
        user: { email: "test@test.com", tokens: { accessToken: "token" } },
      },
      log: { error: sinon.fake() },
      ip: "127.0.0.1",
    };
    const res = {
      locals: {
        persistentSessionId: "persistentSessionId",
      },
      render: sinon.fake(),
    };
    const next = sinon.spy();

    sandbox.replace(mfaModule, "verifyMfaCode", () => false);

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      next
    );
  });
});
