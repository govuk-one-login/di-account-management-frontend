import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";

import { PATH_DATA } from "../../../app.constants";
import {
  checkYourEmailGet,
  checkYourEmailPost,
} from "../check-your-email-controller.js";
import {
  CheckYourEmailServiceError,
  CheckYourEmailServiceInterface,
} from "../types";
import { GovUkPublishingServiceInterface } from "../../common/gov-uk-publishing/types";
import * as oidcModule from "../../../utils/oidc.js";

describe("check your email controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {},
      session: {
        user: { state: { changeEmail: { value: "CHANGE_VALUE" } } },
      } as any,
      cookies: { lng: "en" },
      i18n: { language: "en" },
      log: { error: vi.fn() },
      headers: { "txma-audit-encoded": "encoded" },
    } as any;
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

  describe("checkYourEmailGet", () => {
    it("should render check your phone view", () => {
      checkYourEmailGet(req as Request, res as Response);

      expect(res.render).toHaveBeenCalledWith("check-your-email/index.njk", {
        email: undefined,
      });
    });
  });

  describe("checkYourEmailPost", () => {
    it("should redirect to /email-updated-confirmation when valid code entered", async () => {
      const fakeService: CheckYourEmailServiceInterface = {
        updateEmail: vi.fn().mockResolvedValue({ success: true }),
      };

      const fakePublishingService: GovUkPublishingServiceInterface = {
        notifyAccountDeleted: vi.fn(),
        notifyEmailChanged: vi.fn().mockReturnValue(Promise.resolve()),
      };

      req.session.user.tokens = { accessToken: "token" } as any;
      req.body.code = "123456";

      await checkYourEmailPost(fakeService, fakePublishingService)(
        req as Request,
        res as Response
      );

      expect(fakeService.updateEmail).toHaveBeenCalledOnce();
      expect(fakePublishingService.notifyEmailChanged).toHaveBeenCalledOnce();
      expect(res.redirect).toHaveBeenCalledWith(
        PATH_DATA.EMAIL_UPDATED_CONFIRMATION.url
      );
    });

    it("should return error when invalid code entered", async () => {
      const fakeService: CheckYourEmailServiceInterface = {
        updateEmail: vi.fn().mockResolvedValue({
          success: false,
          error: undefined,
        }),
      };

      req.session.user.tokens = { accessToken: "token" } as any;
      req.t = vi.fn().mockReturnValue("translated string");
      req.body.code = "678988";
      res.locals.sessionId = "123456-djjad";

      await checkYourEmailPost(fakeService)(req as Request, res as Response);

      expect(fakeService.updateEmail).toHaveBeenCalledOnce();
      expect(res.render).toHaveBeenCalledWith("check-your-email/index.njk", {
        code: "678988",
        errorList: [
          {
            href: "#code",
            text: "translated string",
          },
        ],
        errors: {
          code: {
            href: "#code",
            text: "translated string",
          },
        },
        language: "en",
      });
    });

    it("should redirect email address is denied", async () => {
      const fakeService: CheckYourEmailServiceInterface = {
        updateEmail: vi.fn().mockResolvedValue({
          success: false,
          error: CheckYourEmailServiceError.EMAIL_ADDRESS_DENIED,
        }),
      };

      req.session.user.tokens = { accessToken: "token" } as any;
      req.t = vi.fn().mockReturnValue("translated string");
      req.body.code = "678988";
      res.locals.sessionId = "123456-djjad";

      await checkYourEmailPost(fakeService)(req as Request, res as Response);

      expect(fakeService.updateEmail).toHaveBeenCalledOnce();
      expect(res.redirect).toHaveBeenCalledWith(
        `${PATH_DATA.CHANGE_EMAIL.url}?email_cant_be_used=1`
      );
    });
  });
});
