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
import { EventName, LogoutState, PATH_DATA } from "../../../app.constants";
import { UserJourney } from "../../../utils/state-machine";

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

    beforeEach(() => {
      buildAuditEventStub = sinon.stub().returns("dummyAuditEvent");
      sendStub = sinon.stub();
      sinon.stub(eventServiceModule, "eventService").returns({
        buildAuditEvent: buildAuditEventStub,
        send: sendStub,
      });
      handleLogoutStub = sinon.stub(logoutUtils, "handleLogout").resolves();
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should send an audit event when the user logs out", async () => {
      const req = {} as Request;
      const res = {
        locals: { trace: "dummyTrace" },
      } as unknown as Response;

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
      sinon.assert.calledOnce(handleLogoutStub);
      sinon.assert.calledWithExactly(
        handleLogoutStub,
        req,
        res,
        LogoutState.Start
      );
    });
  });
});
