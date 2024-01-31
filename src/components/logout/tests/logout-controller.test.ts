import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { logoutPost } from "../logout-controller";
import { logger } from "../../../utils/logger";
import { ERROR_MESSAGES, LOG_MESSAGES } from "../../../app.constants";

const TEST_TRACE_ID = "trace-id";

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
      locals: {
        sessionId: "session-id",
        trace: TEST_TRACE_ID,
      },
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

      logoutPost(req, res);

    expect(req.session.destroy).to.have.been.calledOnce;
    expect(res.mockCookies.lo).to.equal("true");
    expect(req.oidc.endSessionUrl).to.have.been.calledOnce;
    expect(res.redirect).to.have.called;
    expect(loggerSpy).to.have.been.calledWith(
      { trace: TEST_TRACE_ID },
      LOG_MESSAGES.ATTEMPTING_TO_DESTROY_SESSION
    );
  });

  it("should log error when session destroy fails and continue with logout process", () => {
    const ERROR_MESSAGE = "error";
    req.session = {
      user: {
        tokens: {
          idToken: "id-token",
        },
      },
      destroy: (callback: (err: string) => void) => {
        callback(ERROR_MESSAGE);
      },
    };

    logoutPost(req, res);

    expect(errorLoggerSpy).to.have.been.calledWith(
      { trace: TEST_TRACE_ID },
      ERROR_MESSAGES.FAILED_TO_DESTROY_SESSION(ERROR_MESSAGE)
    );

    expect(res.mockCookies.lo).to.equal("true");
    expect(req.oidc.endSessionUrl).to.have.been.calledOnce;
    expect(res.redirect).to.have.called;
  });
});
