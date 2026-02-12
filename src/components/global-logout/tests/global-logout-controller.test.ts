import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import {
  globalLogoutGet,
  globalLogoutPost,
  globalLogoutConfirmGet,
} from "../global-logout-controller.js";
import * as eventServiceModule from "../../../services/event-service.js";
import * as logoutUtils from "../../../utils/logout.js";
import * as stateMachine from "../../../utils/state-machine.js";
import * as sqsModule from "../../../utils/sqs";
import { EventName, LogoutState, PATH_DATA } from "../../../app.constants";
import { UserJourney } from "../../../utils/state-machine.js";
import { CURRENT_EMAIL, RequestBuilder } from "../../../../test/utils/builders";

describe("Global Logout Controller", () => {
  describe("globalLogoutGet", () => {
    it("should render the correct view", () => {
      const req = {} as Request;
      const res = { render: vi.fn(), locals: {} };
      globalLogoutGet(req, res as unknown as Response);

      expect(res.render).toHaveBeenCalledOnce();
      expect(res.render.mock.calls[0][0]).toBe("global-logout/index.njk");
      expect(res.render.mock.calls[0][1]).toEqual({});
    });
  });

  describe("globalLogoutPost", () => {
    it("should redirect the user to enter their password", () => {
      const req = {} as Request;
      const res = { redirect: vi.fn(), locals: {} };
      globalLogoutPost(req, res as unknown as Response);

      expect(res.redirect).toHaveBeenCalledOnce();
      expect(res.redirect.mock.calls[0][0]).toBe(
        `${PATH_DATA.ENTER_PASSWORD.url}?type=${UserJourney.GlobalLogout}`
      );
    });
  });

  describe("globalLogoutConfirmGet", () => {
    let buildAuditEventStub: ReturnType<typeof vi.fn>;
    let sendStub: ReturnType<typeof vi.fn>;
    let handleLogoutStub: ReturnType<typeof vi.fn>;
    let getNextStateStub: ReturnType<typeof vi.fn>;
    let sendMessageStub: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      buildAuditEventStub = vi.fn().mockReturnValue("dummyAuditEvent");
      sendStub = vi.fn();
      vi.spyOn(eventServiceModule, "eventService").mockReturnValue({
        buildAuditEvent: buildAuditEventStub,
        send: sendStub,
      });
      sendMessageStub = vi.fn().mockResolvedValue();
      vi.spyOn(sqsModule, "sqsService").mockReturnValue({
        sendMessage: sendMessageStub,
        sendAuditEvent: vi.fn(),
      });
      handleLogoutStub = vi
        .spyOn(logoutUtils, "handleLogout")
        .mockResolvedValue();
      getNextStateStub = vi
        .spyOn(stateMachine, "getNextState")
        .mockReturnValue({
          value: "CONFIRMATION",
          events: [
            stateMachine.EventType.Authenticated,
            stateMachine.EventType.ValueUpdated,
          ],
        });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should send an audit event and notification event when the user logs out", async () => {
      const req = new RequestBuilder()
        .withSessionUserState({
          globalLogout: { value: "CHANGE_VALUE" },
        })
        .withHeaders({
          "txma-audit-encoded": btoa(
            JSON.stringify({
              ip_address: "fake_ip_address",
              country_code: "fake_country_code",
              user_agent: "fake_user_agent",
            })
          ),
        })
        .build() as Request;
      const res = {
        locals: { trace: "dummyTrace" },
      } as unknown as Response;
      vi.setSystemTime(new Date(1758582000000));
      process.env.NOTIFICATION_QUEUE_URL = "https://notification-queue-url.com";

      await globalLogoutConfirmGet(req, res);

      expect(buildAuditEventStub).toHaveBeenCalledTimes(1);
      expect(buildAuditEventStub).toHaveBeenCalledWith(
        req,
        res,
        EventName.HOME_GLOBAL_LOGOUT_REQUESTED
      );
      expect(sendStub).toHaveBeenCalledTimes(1);
      expect(sendStub).toHaveBeenCalledWith("dummyAuditEvent", "dummyTrace");
      expect(sendMessageStub).toHaveBeenCalledTimes(1);
      expect(sendMessageStub).toHaveBeenCalledWith(
        "https://notification-queue-url.com",
        JSON.stringify({
          notificationType: "GLOBAL_LOGOUT",
          emailAddress: CURRENT_EMAIL,
          loggedOutAt: "2025-09-22T23:00:00.000Z",
          ipAddress: "fake_ip_address",
          countryCode: "fake_country_code",
          userAgent: "fake_user_agent",
        }),
        "dummyTrace"
      );
      expect(handleLogoutStub).toHaveBeenCalledTimes(1);
      expect(handleLogoutStub).toHaveBeenCalledWith(
        req,
        res,
        LogoutState.Start
      );
      vi.useRealTimers();
    });

    it("should update the user's state", async () => {
      const req = new RequestBuilder()
        .withSessionUserState({
          globalLogout: { value: "CHANGE_VALUE" },
        })
        .withHeaders({
          "txma-audit-encoded": btoa(
            JSON.stringify({
              ip_address: "fake_ip_address",
              country_code: "fake_country_code",
              user_agent: "fake_user_agent",
            })
          ),
        })
        .build() as Request;
      const res = {
        locals: { trace: "dummyTrace" },
      } as unknown as Response;

      await globalLogoutConfirmGet(req, res);

      expect(getNextStateStub).toHaveBeenCalledTimes(1);
      expect(getNextStateStub).toHaveBeenCalledWith(
        "CHANGE_VALUE",
        stateMachine.EventType.ValueUpdated
      );
    });
  });
});
