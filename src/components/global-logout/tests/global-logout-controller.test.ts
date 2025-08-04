import { expect } from "chai";
import sinon from "sinon";
import { Request, Response } from "express";
import { globalLogoutGet, globalLogoutPost } from "../global-logout-controller";
import * as eventServiceModule from "../../../services/event-service";
import * as logoutUtils from "../../../utils/logout";
import { EventName, LogoutState } from "../../../app.constants";

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

      await globalLogoutPost(req, res);

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
