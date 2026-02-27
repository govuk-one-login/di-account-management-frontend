import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logoutRedirectGet } from "../logout-redirect-controller.js";

import {
  RequestBuilder,
  ResponseBuilder,
} from "../../../../test/utils/builders.js";
import { PATH_DATA } from "../../../app.constants.js";

describe("logout redirect controller", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = new RequestBuilder().build();

    res = new ResponseBuilder().withRedirect(vi.fn(() => {})).build();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should redirect to suspended", async () => {
    req.query = { state: "suspended" };

    await logoutRedirectGet(req, res);

    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining(PATH_DATA.UNAVAILABLE_TEMPORARY.url)
    );
  });

  it("should redirect to blocked", async () => {
    req.query = { state: "blocked" };

    await logoutRedirectGet(req, res);

    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining(PATH_DATA.UNAVAILABLE_PERMANENT.url)
    );
  });

  it("should redirect to account deletion", async () => {
    req.query = { state: "accountDeletion" };

    await logoutRedirectGet(req, res);

    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining(PATH_DATA.ACCOUNT_DELETED_CONFIRMATION.url)
    );
  });

  it("should redirect to start", async () => {
    req.query = { state: "start" };

    await logoutRedirectGet(req, res);

    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining(PATH_DATA.START.url)
    );
  });

  it("should redirect to default if state is not set", async () => {
    req.query = {};

    await logoutRedirectGet(req, res);

    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining(PATH_DATA.USER_SIGNED_OUT.url)
    );
  });
});
