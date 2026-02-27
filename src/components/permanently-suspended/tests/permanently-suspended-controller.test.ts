import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { permanentlySuspendedGet } from "../permanently-suspended-controller.js";
import * as config from "../../../config.js";
import {
  RequestBuilder,
  ResponseBuilder,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";

describe("temporarily suspended controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.spyOn(config, "supportSearchableList").mockReturnValue(false);

    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ addBackup: { value: "CHANGE_VALUE" } })
      .withTranslate(vi.fn((id) => id))
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .build();

    res = new ResponseBuilder()
      .withRender(vi.fn())
      .withRedirect(vi.fn())
      .withStatus(vi.fn())
      .build();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("permanentlySuspendedGet", () => {
    it("should render the permanently suspended view", () => {
      permanentlySuspendedGet(req as Request, res as Response);

      expect(res.render).toHaveBeenCalledWith(
        "permanently-suspended/index.njk",
        {
          searchableListEnabled: false,
        }
      );
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
