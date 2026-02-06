import { expect } from "chai";
import { describe } from "mocha";
import { NextFunction, Request, Response } from "express";
import { sinon } from "../../utils/test-utils.js";
import { validateStateMiddleware } from "../../../src/middleware/validate-state-middleware.js";

describe("validate state middleware", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  const info: sinon.SinonSpy = sinon.spy();

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    next = sinon.fake(() => {});

    req = {
      url: "/choose-backup",
      path: "/choose-backup",
      body: {},
      query: {},
      session: {
        user: {
          email: "test@example.com",
          tokens: { accessToken: "dummytoken" },
          state: {
            addBackup: { value: "CHNAGE_VALUE", events: ["SELECTED_APP"] },
          },
        },
      } as any,
      oidc: { authorizationUrl: sinon.fake(), metadata: {} as any } as any,
      log: {
        info,
      } as any,
    };
    res = {
      render: sinon.fake(),
      redirect: sandbox.fake(() => {}),
      locals: { trace: {} },
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should continue to next middleware and pass validation", async () => {
    res.locals.sessionId = "sessionId";
    res.locals.persistentSessionId = "persistentSessionId";

    validateStateMiddleware(req as Request, res as Response, next);

    expect(next).to.have.been.called;
  });
});
