import { expect } from "chai";
import { describe, it } from "mocha";
import { Request, Response } from "express";
import sinon, { SinonSandbox } from "sinon";
import {
  addMfaMethodPost,
  addMfaAppMethodGet,
  addMfaAppMethodPost,
} from "../add-mfa-methods-controller";
import { PATH_DATA } from "../../../app.constants";
import * as mfaModule from "../../../utils/mfa";
import QRCode from "qrcode";

describe("addMfaMethodPost", () => {
  let sandbox: SinonSandbox;
  let req: Partial<Request>;
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
    req = { body: {}, log: { error: sandbox.fake() } as any };
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
    req.body.addMfaMethod = "sms";

    addMfaMethodPost(req as Request, res as Response, next);

    expect(res.redirect).to.have.been.calledWith(
      PATH_DATA.ADD_MFA_METHOD_SMS.url
    );
  });

  it("should take the user to the add auth app page when the user selects that option", () => {
    req.body.addMfaMethod = "app";

    addMfaMethodPost(req as Request, res as Response, next);

    expect(res.redirect).to.have.been.calledWith(
      PATH_DATA.ADD_MFA_METHOD_APP.url
    );
  });

  it("should call next with an error when addMfaMethod is unknown", () => {
    req.body.addMfaMethod = "unknown";

    addMfaMethodPost(req as Request, res as Response, next);

    const call: sinon.SinonSpyCall<Error[], unknown> = next.getCall(0);

    expect(call.args[0].message).to.equal("Unknown addMfaMethod: unknown");
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

    expect(res.render).to.have.been.calledWith("add-mfa-method/add-app.njk", {
      authAppSecret: "A".repeat(20),
      qrCode: await QRCode.toDataURL("qrcode"),
      formattedSecret: "AAAA AAAA AAAA AAAA AAAA",
      errors: {},
      errorList: [],
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

  it("should send the request to add mfaMethod", async () => {
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
      t: (t: string) => t,
    };
    const res = {
      locals: {
        persistentSessionId: "persistentSessionId",
      },
      render: sinon.fake(),
    };
    const next = sinon.spy();
    const addMfaMethod = sinon.fake.returns({
      status: 200,
      data: {
        endPoint: "endPoint",
        mfaIdentifier: 1,
        methodVerified: true,
        mfaMethodType: "AUTH_APP",
        priorityIdentifier: "SECONDARY",
      },
    });

    sandbox.replace(mfaModule, "verifyMfaCode", () => true);
    sandbox.replace(mfaModule, "addMfaMethod", addMfaMethod);

    await addMfaAppMethodPost(
      req as unknown as Request,
      res as unknown as Response,
      next
    );

    expect(addMfaMethod).to.have.been.calledWith({
      email: "test@test.com",
      otp: "123456",
      credential: "AAAAAAAAAAAAAAAAAAAA",
      mfaMethod: { priorityIdentifier: "SECONDARY", mfaMethodType: "AUTH_APP" },
      accessToken: "token",
      sourceIp: "127.0.0.1",
      sessionId: "session_id",
      persistentSessionId: "persistentSessionId",
    });

    expect(res.render).to.be.calledWith(
      "common/confirmation-page/confirmation.njk",
      {
        heading: "pages.confirmAddMfaMethod.heading",
        message: "pages.confirmAddMfaMethod.message",
        backLinkText: "pages.confirmAddMfaMethod.backLinkText",
        backLink: PATH_DATA.SECURITY.url,
      }
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
      t: (t: string) => t,
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
