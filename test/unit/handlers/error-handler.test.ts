import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../utils/test-utils";
import { NextFunction, Request, Response } from "express";
import { pageNotFoundHandler } from "../../../src/handlers/page-not-found-handler";
import { serverErrorHandler } from "../../../src/handlers/internal-server-error-handler";
import { PATH_DATA } from "../../../src/app.constants";

describe("Error handlers", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = { app: { locals: {} } } as Partial<Request>;
    res = {
      render: sandbox.fake(),
      status: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      locals: {},
    };
    next = sandbox.fake(() => {});
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("pageNotFoundHandler", () => {
    it("should render 404 view", () => {
      pageNotFoundHandler(req as Request, res as Response, next);

      expect(res.locals?.opl).to.deep.eq({
        contentId: "undefined",
        dynamic: true,
        loggedInStatus: true,
        isPageDataSensitive: true,
        taxonomyLevel1: "accounts",
        taxonomyLevel2: "undefined",
        taxonomyLevel3: "undefined",
      });
      expect(res.status).to.have.been.calledOnceWith(404);
      expect(res.render).to.have.been.calledOnceWith("common/errors/404.njk");
    });
  });

  describe("serverErrorHandler", () => {
    it("should render 500 view when csrf token is invalid", async () => {
      const err: any = new Error("invalid csrf token");
      err["code"] = "EBADCSRFTOKEN";

      await serverErrorHandler(err, req as Request, res as Response, next);

      expect(res.locals?.opl).to.deep.eq({
        contentId: "undefined",
        dynamic: true,
        loggedInStatus: true,
        isPageDataSensitive: true,
        taxonomyLevel1: "accounts",
        taxonomyLevel2: "undefined",
        taxonomyLevel3: "undefined",
      });
      expect(res.status).to.have.been.calledOnceWith(500);
      expect(res.render).to.have.been.calledOnceWith("common/errors/500.njk");
    });

    it("should render 500 view when unexpected error", async () => {
      const err = new Error("internal server error");

      await serverErrorHandler(err, req as Request, res as Response, next);

      expect(res.locals?.opl).to.deep.eq({
        contentId: "undefined",
        dynamic: true,
        loggedInStatus: true,
        isPageDataSensitive: true,
        taxonomyLevel1: "accounts",
        taxonomyLevel2: "undefined",
        taxonomyLevel3: "undefined",
      });
      expect(res.status).to.have.been.calledOnceWith(500);
      expect(res.render).to.have.been.calledOnceWith("common/errors/500.njk");
    });

    it("should render timeout view when no session", async () => {
      const err = new Error("timeout");
      res.statusCode = 401;

      await serverErrorHandler(err, req as Request, res as Response, next);

      expect(res.locals?.opl).to.deep.eq({
        contentId: "undefined",
        dynamic: true,
        loggedInStatus: true,
        isPageDataSensitive: true,
        taxonomyLevel1: "accounts",
        taxonomyLevel2: "undefined",
        taxonomyLevel3: "undefined",
      });
      expect(res.redirect).to.have.been.calledOnceWith(
        PATH_DATA.SESSION_EXPIRED.url
      );
    });
  });
});
