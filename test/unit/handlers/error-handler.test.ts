import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// import { sinon } from "../../utils/test-utils.js";
import { NextFunction, Request, Response } from "express";
import { pageNotFoundHandler } from "../../../src/handlers/page-not-found-handler.js";
import { serverErrorHandler } from "../../../src/handlers/internal-server-error-handler.js";
import { PATH_DATA } from "../../../src/app.constants.js";

describe("Error handlers", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { app: { locals: {} } } as Partial<Request>;
    res = {
      render: vi.fn(),
      status: vi.fn(),
      redirect: vi.fn(() => {}),
      locals: {},
    };
    next = vi.fn(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("pageNotFoundHandler", () => {
    it("should render 404 view", () => {
      pageNotFoundHandler(req as Request, res as Response, next);

      expect(res.locals?.opl).toMatchObject({
        contentId: "undefined",
        dynamic: true,
        loggedInStatus: true,
        isPageDataSensitive: false,
        taxonomyLevel1: "accounts",
        taxonomyLevel2: "undefined",
        taxonomyLevel3: "undefined",
      });
      expect(res.status).toHaveBeenCalledOnce();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.render).toHaveBeenCalledOnce();
      expect(res.render).toHaveBeenCalledWith("common/errors/404.njk");
    });
  });

  describe("serverErrorHandler", () => {
    it("should render 500 view when csrf token is invalid", async () => {
      const err: any = new Error("invalid csrf token");
      err.code = "EBADCSRFTOKEN";

      await serverErrorHandler(err, req as Request, res as Response, next);

      expect(res.locals?.opl).toMatchObject({
        contentId: "undefined",
        dynamic: true,
        loggedInStatus: true,
        isPageDataSensitive: false,
        taxonomyLevel1: "accounts",
        taxonomyLevel2: "undefined",
        taxonomyLevel3: "undefined",
      });
      expect(res.status).toHaveBeenCalledOnce();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.render).toHaveBeenCalledOnce();
      expect(res.render).toHaveBeenCalledWith("common/errors/500.njk");
    });

    it("should render 500 view when unexpected error", async () => {
      const err = new Error("internal server error");

      await serverErrorHandler(err, req as Request, res as Response, next);

      expect(res.locals?.opl).toMatchObject({
        contentId: "undefined",
        dynamic: true,
        loggedInStatus: true,
        isPageDataSensitive: false,
        taxonomyLevel1: "accounts",
        taxonomyLevel2: "undefined",
        taxonomyLevel3: "undefined",
      });
      expect(res.status).toHaveBeenCalledOnce();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.render).toHaveBeenCalledOnce();
      expect(res.render).toHaveBeenCalledWith("common/errors/500.njk");
    });

    it("should render timeout view when no session", async () => {
      const err = new Error("timeout");
      res.statusCode = 401;

      await serverErrorHandler(err, req as Request, res as Response, next);

      expect(res.locals?.opl).toMatchObject({
        contentId: "undefined",
        dynamic: true,
        loggedInStatus: true,
        isPageDataSensitive: false,
        taxonomyLevel1: "accounts",
        taxonomyLevel2: "undefined",
        taxonomyLevel3: "undefined",
      });
      expect(res.redirect).toHaveBeenCalledOnce();
      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SESSION_EXPIRED.url);
    });
  });
});
