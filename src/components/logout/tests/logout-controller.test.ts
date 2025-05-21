import { expect } from "chai";
import { describe } from "mocha";
import * as sessionStore from "../../../utils/session-store";
import { sinon } from "../../../../test/utils/test-utils";
import { logoutPost } from "../logout-controller";
import { logger } from "../../../utils/logger";

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
      session: { user: { subjectId: "subject-id" } } as any,
      oidc: { endSessionUrl: sandbox.fake() },
      app: { locals: { sessionStore: sandbox.fake() } },
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
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

  it("should execute logout process", async () => {
    req.session.user.tokens = {
      idToken: "id-token",
    } as any;

    req.session.destroy = sandbox.fake();

    const destroyUserSessionsStub = sinon.stub(
      sessionStore,
      "destroyUserSessions"
    );
    await logoutPost(req, res);

    expect(res.mockCookies.lo).to.equal("true");
    expect(req.oidc.endSessionUrl).to.have.been.calledOnce;
    expect(res.redirect).to.have.called;
    expect(destroyUserSessionsStub).to.have.been.called;
    destroyUserSessionsStub.restore();
  });
});
