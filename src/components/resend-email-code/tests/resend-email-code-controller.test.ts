import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import * as oidcModule from "../../../utils/oidc.js";

import {
  resendEmailCodeGet,
  resendEmailCodePost,
} from "../resend-email-code-controller.js";
import { ChangeEmailServiceInterface } from "../../change-email/types";
import { getInitialState } from "../../../utils/state-machine.js";
import { TXMA_AUDIT_ENCODED } from "../../../../test/utils/builders";

describe("check your email controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {},
      session: { user: {} } as any,
      cookies: { lng: "en" },
      i18n: { language: "en" },
      headers: { "txma-audit-encoded": TXMA_AUDIT_ENCODED },
    };
    res = {
      render: vi.fn(),
      redirect: vi.fn(() => {}),
      status: vi.fn(),
      locals: {},
    };

    vi.spyOn(oidcModule, "refreshToken").mockImplementation(async () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("resendEmailCodeGet", () => {
    it("should render resend email code view", () => {
      req.session.user = {
        newEmailAddress: "test@test.com",
      } as any;
      resendEmailCodeGet(req as Request, res as Response);

      expect(res.render).toHaveBeenCalledWith("resend-email-code/index.njk", {
        emailAddress: "test@test.com",
      });
    });
  });

  describe("resendEmailCodePost", () => {
    it("should redirect to /check-your-email when get security code is executed", async () => {
      const fakeService: ChangeEmailServiceInterface = {
        sendCodeVerificationNotification: vi.fn().mockResolvedValue(true),
      };

      req.session.user = {
        tokens: { accessToken: "token" },
        email: "test@dl.com",
        newEmailAddress: "test@test.com",
        state: { changeEmail: getInitialState() },
      } as any;
      req.cookies.lng = "en";

      await resendEmailCodePost(fakeService)(req as Request, res as Response);

      expect(
        fakeService.sendCodeVerificationNotification
      ).toHaveBeenCalledOnce();
      expect(res.redirect).toHaveBeenCalledWith("/check-your-email");
    });
  });
});
