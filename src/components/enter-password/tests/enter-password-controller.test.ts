import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import {
  enterPasswordGet,
  enterPasswordPost,
} from "../enter-password-controller.js";
import { EnterPasswordServiceInterface } from "../types";
import { HTTP_STATUS_CODES, PATH_DATA, EventName, JourneyAction } from "../../../app.constants";
import { TXMA_AUDIT_ENCODED } from "../../../../test/utils/builders";
import * as logout from "../../../utils/logout.js";
import { UserJourney } from "../../../utils/state-machine.js";
import * as oidcModule from "../../../utils/oidc.js";
import { eventService } from "../../../services/event-service.js";

vi.mock("../../../services/event-service.js");

describe("enter password controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let mockEventService: {
    buildAuditEvent: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockEventService = {
      buildAuditEvent: vi.fn().mockReturnValue({ event: "test-event" }),
      send: vi.fn(),
    };
    vi.mocked(eventService).mockReturnValue(mockEventService as any);

    req = {
      body: {},
      cookies: {},
      session: {
        user: {
          state: {
            changePassword: {},
            changePhoneNumber: {},
            changeEmail: {},
            deleteAccount: {},
          },
        },
        destroy: vi.fn((callback) => callback()),
      } as any,
      t: vi.fn(),
      i18n: { language: "en" },
      query: {},
      headers: { "txma-audit-encoded": TXMA_AUDIT_ENCODED },
      app: { locals: { sessionStore: vi.fn() } } as any,
      oidc: { endSessionUrl: vi.fn() } as any,
    };
    res = {
      render: vi.fn(),
      clearCookie: vi.fn(),
      redirect: vi.fn(() => {}),
      status: vi.fn(),
      cookie: vi.fn(),
      locals: { trace: "test-trace" },
    };
    vi.spyOn(oidcModule, "refreshToken").mockImplementation(async () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("enterPasswordGet", () => {
    it("should render enter password view with query param", async () => {
      req.query.type = "changePassword";

      await enterPasswordGet(req as Request, res as Response);

      expect(res.render).toHaveBeenCalledWith(
        "enter-password/index.njk",
        expect.objectContaining({
          requestType: "changePassword",
        })
      );
    });

    it("should redirect to security when there is no 'type' query parameter", async () => {
      await enterPasswordGet(req as Request, res as Response);

      expect(res.render).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SECURITY.url);
    });

    it("should send an AUTH_MFA_METHOD_ADD_STARTED audit event when journey type is addBackup", async () => {
      req.query.type = UserJourney.addBackup;

      const mockEventService = {
        buildAuditEvent: vi.fn().mockReturnValue({ event: "test-event" }),
        send: vi.fn(),
      };

      const eventServiceStub = vi.fn().mockReturnValue(mockEventService);

      const eventServiceModule =
        await import("../../../services/event-service");
      vi.spyOn(eventServiceModule, "eventService", "get").mockReturnValue(
        eventServiceStub
      );

      await enterPasswordGet(req as Request, res as Response);

      expect(mockEventService.buildAuditEvent).toHaveBeenCalledWith(
        req,
        res,
        "AUTH_MFA_METHOD_ADD_STARTED"
      );
      // Should be called twice: once for journey audit event, once for action started event
      expect(mockEventService.send).toHaveBeenCalledTimes(2);
      expect(res.render).toHaveBeenCalledWith(
        "enter-password/index.njk",
        expect.objectContaining({
          requestType: "addBackup",
        })
      );
    });

    it("should send an AUTH_MFA_METHOD_SWITCH_STARTED audit event when journey type is SwitchBackupMethod", async () => {
      req.query.type = UserJourney.SwitchBackupMethod;

      const mockEventService = {
        buildAuditEvent: vi.fn().mockReturnValue({ event: "test-event" }),
        send: vi.fn(),
      };

      const eventServiceStub = vi.fn().mockReturnValue(mockEventService);

      const eventServiceModule =
        await import("../../../services/event-service");
      vi.spyOn(eventServiceModule, "eventService", "get").mockReturnValue(
        eventServiceStub
      );

      await enterPasswordGet(req as Request, res as Response);

      expect(mockEventService.buildAuditEvent).toHaveBeenCalledWith(
        req,
        res,
        "AUTH_MFA_METHOD_SWITCH_STARTED"
      );
      // Should be called twice: once for journey audit event, once for action started event
      expect(mockEventService.send).toHaveBeenCalledTimes(2);
      expect(res.render).toHaveBeenCalledWith(
        "enter-password/index.njk",
        expect.objectContaining({
          requestType: "switchBackupMethod",
        })
      );
    });

    it("should send an AUTH_MFA_METHOD_DELETE_STARTED audit event when journey type is RemoveBackup", async () => {
      req.query.type = UserJourney.RemoveBackup;

      const mockEventService = {
        buildAuditEvent: vi.fn().mockReturnValue({ event: "test-event" }),
        send: vi.fn(),
      };

      const eventServiceStub = vi.fn().mockReturnValue(mockEventService);

      const eventServiceModule =
        await import("../../../services/event-service");
      vi.spyOn(eventServiceModule, "eventService", "get").mockReturnValue(
        eventServiceStub
      );

      await enterPasswordGet(req as Request, res as Response);

      expect(mockEventService.buildAuditEvent).toHaveBeenCalledWith(
        req,
        res,
        "AUTH_MFA_METHOD_DELETE_STARTED"
      );
      // Should be called twice: once for journey audit event, once for action started event
      expect(mockEventService.send).toHaveBeenCalledTimes(2);
      expect(res.render).toHaveBeenCalledWith(
        "enter-password/index.njk",
        expect.objectContaining({
          requestType: "removeBackup",
        })
      );
    });

    it("should not send an audit event when journey type is change password", async () => {
      req.query.type = UserJourney.ChangePassword;

      const mockEventService = {
        buildAuditEvent: vi.fn().mockReturnValue({ event: "test-event" }),
        send: vi.fn(),
      };

      const eventServiceStub = vi.fn().mockReturnValue(mockEventService);

      const eventServiceModule =
        await import("../../../services/event-service");
      vi.spyOn(eventServiceModule, "eventService", "get").mockReturnValue(
        eventServiceStub
      );

      await enterPasswordGet(req as Request, res as Response);
      // Should be called once for the action started event (with undefined action)
      expect(mockEventService.send).toHaveBeenCalledTimes(1);
      expect(res.render).toHaveBeenCalledWith(
        "enter-password/index.njk",
        expect.objectContaining({
          requestType: "changePassword",
        })
      );
    });

    it("should send HOME_ACTION_STARTED audit event for CreatePasskey journey", async () => {
      req.query.type = UserJourney.CreatePasskey;

      await enterPasswordGet(req as Request, res as Response);

      expect(mockEventService.buildAuditEvent).toHaveBeenCalledWith(
        req,
        res,
        EventName.HOME_ACTION_STARTED,
        { account_action: JourneyAction.PASSKEY_CREATE }
      );
      expect(mockEventService.send).toHaveBeenCalledWith(
        { event: "test-event" },
        "test-trace"
      );
      expect(res.render).toHaveBeenCalledWith(
        "enter-password/index.njk",
        expect.objectContaining({
          requestType: "createPasskey",
        })
      );
    });

    it("should send HOME_ACTION_STARTED audit event for RemovePasskey journey", async () => {
      req.query.type = UserJourney.RemovePasskey;

      await enterPasswordGet(req as Request, res as Response);

      expect(mockEventService.buildAuditEvent).toHaveBeenCalledWith(
        req,
        res,
        EventName.HOME_ACTION_STARTED,
        { account_action: JourneyAction.PASSKEY_REMOVE }
      );
      expect(mockEventService.send).toHaveBeenCalledWith(
        { event: "test-event" },
        "test-trace"
      );
      expect(res.render).toHaveBeenCalledWith(
        "enter-password/index.njk",
        expect.objectContaining({
          requestType: "removePasskey",
        })
      );
    });

    it("should not send HOME_ACTION_STARTED audit event for non-passkey journeys", async () => {
      req.query.type = UserJourney.ChangeEmail;

      await enterPasswordGet(req as Request, res as Response);

      // Should be called once for the action started event (with undefined action)
      expect(mockEventService.buildAuditEvent).toHaveBeenCalledTimes(1);
      expect(mockEventService.buildAuditEvent).toHaveBeenCalledWith(
        req,
        res,
        EventName.HOME_ACTION_STARTED,
        { account_action: undefined }
      );
    });
  });

  describe("enterPasswordPost", () => {
    it("should redirect to security when there is no 'type' query parameter in enter password post", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: vi.fn().mockResolvedValue({ authenticated: true }),
      };

      req.body.password = "password";

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(res.render).not.toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SECURITY.url);
    });

    it("should redirect to change-email when the password is correct", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: vi.fn().mockResolvedValue({ authenticated: true }),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        state: { changeEmail: { value: "CHANGE_VALUE" } },
        tokens: { accessToken: "token" },
      } as any;

      req.body.password = "password";
      req.query.type = "changeEmail";

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.CHANGE_EMAIL.url);
    });

    it("should bad request when user doesn't enter a password", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: vi.fn().mockResolvedValue({ authenticated: true }),
      };

      req.body.password = "";
      req.query.type = "changeEmail";
      req.query.from = "security";
      req.query.edit = "true";
      req.url =
        "https://test.com/enter-password?from=security&edit=true&type=changeEmail";

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(fakeService.authenticated).not.toHaveBeenCalled();
      expect(res.render).toHaveBeenCalled();
      expect(res.render).toHaveBeenCalledWith("enter-password/index.njk", {
        requestType: "changeEmail",
        from: "security",
        fromDetails: {
          translationKey: "general.cancelAndBackToSecurityText",
          url: "/security",
        },
        formAction:
          "https://test.com/enter-password?from=security&edit=true&type=changeEmail",
        errors: { password: { text: undefined, href: "#password" } },
        errorList: [{ text: undefined, href: "#password" }],
        language: "en",
        password: "",
      });
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });

    it("should bad request when user credentials are incorrect", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: vi.fn().mockResolvedValue({ authenticated: false }),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        tokens: { accessToken: "token" },
      } as any;

      req.body.password = "password";
      req.query.type = "changeEmail";
      req.query.edit = "true";
      req.url = "https://test.com/enter-password?edit=true&type=changeEmail";

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(res.render).toHaveBeenCalled();
      expect(res.render).toHaveBeenCalledWith("enter-password/index.njk", {
        requestType: "changeEmail",
        from: undefined,
        fromDetails: undefined,
        formAction:
          "https://test.com/enter-password?edit=true&type=changeEmail",
        errors: { password: { text: undefined, href: "#password" } },
        errorList: [{ text: undefined, href: "#password" }],
        language: "en",
        password: "password",
      });
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });

    it("should logout and redirect to permanently suspended when intervention is BLOCKED", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: vi.fn().mockResolvedValue({
          authenticated: false,
          intervention: "BLOCKED",
        }),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        tokens: { accessToken: "token" },
        state: { changeEmail: { value: "CHANGE_VALUE" } },
      } as any;

      req.body.password = "password";
      req.query.type = "changeEmail";

      const handleLogoutStub = vi.spyOn(logout, "handleLogout");

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(handleLogoutStub).toHaveBeenCalledWith(req, res, "blocked");
    });

    it("should logout and redirect to unavailable temporary when intervention is SUSPENDED", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: vi.fn().mockResolvedValue({
          authenticated: false,
          intervention: "SUSPENDED",
        }),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        tokens: { accessToken: "token" },
        state: { changeEmail: { value: "CHANGE_VALUE" } },
      } as any;

      req.body.password = "password";
      req.query.type = "changeEmail";

      const handleLogoutStub = vi.spyOn(logout, "handleLogout");

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(handleLogoutStub).toHaveBeenCalledWith(req, res, "suspended");
    });

    it("should pass on parameters when redirecting after successful authentication", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: vi.fn().mockResolvedValue({ authenticated: true }),
      };

      req.session.user = {
        state: { removePasskey: { value: "CHANGE_VALUE" } },
        tokens: { accessToken: "token" },
      } as any;

      req.body.password = "password";
      req.query = {
        type: "removePasskey",
        from: "security",
        passkeyId: "12345",
      };

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(res.redirect).toHaveBeenCalledWith(
        "/remove-passkey?from=security&id=12345"
      );
    });
  });
});
