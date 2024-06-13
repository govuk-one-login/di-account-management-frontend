import { expect } from "chai";
import { describe, it } from "mocha";
import { Request, Response } from "express";
import { SinonSandbox } from "sinon";
import { sinon } from "../../../../test/utils/test-utils.js";

import {
  addMfaMethodPost,
  addMfaMethodGet,
} from "../add-mfa-methods-controller";
import { PATH_DATA } from "../../../app.constants.js";
import { EventType } from "../../../utils/state-machine.js";

describe("addMfaMethodGet", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: {
        user: { state: { addMfaMethod: { value: EventType.Authenticated } } },
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
      status: sandbox.fake(),
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should add mfa method page", () => {
    addMfaMethodGet(req as Request, res as Response);

    expect(res.render).to.have.calledWith("add-mfa-method/index.njk");
  });
});

describe("addMfaMethodPost", () => {
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
        user: { state: { addMfaMethod: { value: "SMS" } } },
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
