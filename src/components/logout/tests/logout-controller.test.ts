import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { logoutGet } from "../logout-controller";
import { logger } from "../../../utils/logger";
import { LOG_MESSAGES } from "../../../app.constants";
import { ERROR_MESSAGES } from "../../../app.constants";

describe("logout controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: any;
  let res: any;
  let loggerSpy: sinon.SinonSpy;
  let errorLoggerSpy: sinon.SinonSpy;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    loggerSpy = sinon.spy(logger, "info");
    errorLoggerSpy = sinon.spy(logger, "error");
    req = {
      body: {},
      session: { user: {} } as any,
      oidc: { endSessionUrl: sandbox.fake() },
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(),
      locals: { sessionId: "session-id" },
      mockCookies: {},
      cookie: function (name: string, value: string) {
        this.mockCookies[name] = value;
      },
    };
  });

  afterEach(() => {
    sandbox.restore();
    loggerSpy.restore();
    errorLoggerSpy.restore();
  });

  it("should execute logout process", () => {
    req.session.user.tokens = {
      idToken: "id-token",
    } as any;

    req.session.destroy = sandbox.fake();

    logoutGet(req, res);

    expect(req.session.destroy).to.have.been.calledOnce;
    expect(res.mockCookies.lo).to.equal("true");
    expect(req.oidc.endSessionUrl).to.have.been.calledOnce;
    expect(res.redirect).to.have.called;
    expect(loggerSpy).to.have.been.calledWith(
      { trace: res.locals.sessionId },
      LOG_MESSAGES.ATTEMPTING_TO_DESTROY_SESSION
    );
  });

  it("should log error when session destroy fails and continue with logout process", () => {
    const mockSession = {
      user: {
        tokens: {
          idToken: "id-token",
        },
      },
      destroy: (callback: () => void) => {
        callback();
      },
    };

    req.session = mockSession;

    logoutGet(req, res);

    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: res.locals.sessionId },
      ERROR_MESSAGES.FAILED_TO_DESTROY_SESSION
    );
    expect(res.mockCookies.lo).to.equal("true");
    expect(req.oidc.endSessionUrl).to.have.been.calledOnce;
    expect(res.redirect).to.have.called;
  });
});
