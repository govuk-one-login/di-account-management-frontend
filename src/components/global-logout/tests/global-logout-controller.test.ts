import { expect } from "chai";
import sinon from "sinon";
import { Request, Response } from "express";
import {
  globalLogoutGet,
  globalLogoutPost,
  globalLogoutConfirmGet,
} from "../global-logout-controller";
import * as eventServiceModule from "../../../services/event-service";
import * as logoutUtils from "../../../utils/logout";
import * as stateMachine from "../../../utils/state-machine";
import * as sqsModule from "../../../utils/sqs";
import { EventName, LogoutState, PATH_DATA } from "../../../app.constants";
import { UserJourney } from "../../../utils/state-machine";
import { CURRENT_EMAIL, RequestBuilder } from "../../../../test/utils/builders";

describe("Global Logout Controller", () => {
  describe("globalLogoutGet", () => {
    it("should render the correct view", () => {
      const req = {} as Request;
      const res = { render: sinon.spy(), locals: {} };
      globalLogoutGet(req, res as unknown as Response);

      expect(res.render.calledOnce).to.be.true;
      expect(res.render.firstCall.args[0]).to.equal("global-logout/index.njk");
      expect(res.render.firstCall.args[1]).to.deep.equal({});
    });
  });

  describe("globalLogoutPost", () => {
    it("should redirect the user to enter their password", () => {
      const req = {} as Request;
      const res = { redirect: sinon.spy(), locals: {} };
      globalLogoutPost(req, res as unknown as Response);

      expect(res.redirect.calledOnce).to.be.true;
      expect(res.redirect.firstCall.args[0]).to.equal(
        `${PATH_DATA.ENTER_PASSWORD.url}?type=${UserJourney.GlobalLogout}`
      );
    });
  });

  describe("globalLogoutConfirmGet", () => {
    let buildAuditEventStub: sinon.SinonStub;
    let sendStub: sinon.SinonStub;
    let handleLogoutStub: sinon.SinonStub;
    let getNextStateStub: sinon.SinonStub;
    let sendMessageStub: sinon.SinonStub;

    beforeEach(() => {
      buildAuditEventStub = sinon.stub().returns("dummyAuditEvent");
      sendStub = sinon.stub();
      sinon.stub(eventServiceModule, "eventService").returns({
        buildAuditEvent: buildAuditEventStub,
        send: sendStub,
      });
      sendMessageStub = sinon.stub().resolves();
      sinon.stub(sqsModule, "sqsService").returns({
        sendMessage: sendMessageStub,
        sendAuditEvent: sinon.stub(),
      });
      handleLogoutStub = sinon.stub(logoutUtils, "handleLogout").resolves();
      getNextStateStub = sinon.stub(stateMachine, "getNextState").returns({
        value: "CONFIRMATION",
        events: [
          stateMachine.EventType.Authenticated,
          stateMachine.EventType.ValueUpdated,
        ],
      });
    });

    afterEach(() => {
      sinon.restore();
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
      sinon.useFakeTimers(1758582000000);
      process.env.NOTIFICATION_QUEUE_URL = "https://notification-queue-url.com";

      await globalLogoutConfirmGet(req, res);

      sinon.assert.calledOnce(buildAuditEventStub);
      sinon.assert.calledWithExactly(
        buildAuditEventStub,
        req,
        res,
        EventName.HOME_GLOBAL_LOGOUT_REQUESTED
      );
      sinon.assert.calledOnce(sendStub);
      sinon.assert.calledWithExactly(sendStub, "dummyAuditEvent", "dummyTrace");
      sinon.assert.calledOnce(sendMessageStub);
      sinon.assert.calledWith(
        sendMessageStub,
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
      sinon.assert.calledOnce(handleLogoutStub);
      sinon.assert.calledWithExactly(
        handleLogoutStub,
        req,
        res,
        LogoutState.Start
      );
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

      sinon.assert.calledOnce(getNextStateStub);
      sinon.assert.calledWithExactly(
        getNextStateStub,
        "CHANGE_VALUE",
        stateMachine.EventType.ValueUpdated
      );
    });
  });
});
