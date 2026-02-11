import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { temporarilySuspendedGet } from "../temporarily-suspended-controller.js";
import {
  RequestBuilder,
  ResponseBuilder,
} from "../../../../test/utils/builders";

describe("temporarily suspended controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = new RequestBuilder().withBody({}).build();

    res = new ResponseBuilder()
      .withRender(vi.fn())
      .withRedirect(vi.fn())
      .withStatus(vi.fn())
      .build();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("temporarilySuspendedGet", () => {
    it("should render the temporarily suspended view", () => {
      temporarilySuspendedGet(req as Request, res as Response);

      expect(res.render).toHaveBeenCalledWith(
        "temporarily-suspended/index.njk"
      );
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
