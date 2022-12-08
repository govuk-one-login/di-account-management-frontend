import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  deleteAccountGet,
  deleteAccountPost,
} from "../delete-account-controller";
import { DeleteAccountServiceInterface } from "../types";
import { GovUkPublishingServiceInterface } from "../../common/gov-uk-publishing/types";

describe("delete account controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  function validRequest(): any {
    return {
      app: {
        locals: {
          sessionStore: {
            destroy: sandbox.fake(),
          },
          subjectSessionIndexService: {
            removeSession: sandbox.fake(),
            getSessions: sandbox.stub().resolves(["session-1", "session-2"]),
          },
        },
      },
      body: {},
      session: {
        user: { state: { deleteAccount: {} } },
        destroy: sandbox.fake(),
      },
      log: { error: sandbox.fake() },
    };
  }

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    res = { render: sandbox.fake(), redirect: sandbox.fake(), locals: {} };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("deleteAccountGet", () => {
    it("should render delete account page", () => {
      req = validRequest();
      deleteAccountGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("delete-account/index.njk");
    });
  });

  describe("deleteAccountPost", () => {
    describe("when not supporting DELETE_SERVICE_STORE", () => {
      beforeEach(() => {
        process.env.SUPPORT_DELETE_SERVICE_STORE = "0"
      });
    
      afterEach(() => {
        delete process.env.SUPPORT_DELETE_SERVICE_STORE;
      });
      it("should redirect to deletion confirmed page", async () => {
        req = validRequest();
        const fakeService: DeleteAccountServiceInterface = {
          deleteAccount: sandbox.fake(),
          deleteServiceData: sandbox.fake(),
        };

        const fakePublishingService: GovUkPublishingServiceInterface = {
          notifyAccountDeleted: sandbox.fake.returns(Promise.resolve()),
          notifyEmailChanged: sandbox.fake(),
        };

        req.session.user.email = "test@test.com";
        req.session.user.subjectId = "public-subject-id";
        req.session.user.tokens = { accessToken: "token" };
        req.oidc = {
          endSessionUrl: sandbox.fake.returns("logout-url"),
        };

        await deleteAccountPost(fakeService, fakePublishingService)(
          req as Request,
          res as Response
        );

        expect(fakeService.deleteAccount).to.have.been.called;
        expect(fakeService.deleteServiceData).not.to.have.been.calledOnce;
        expect(fakePublishingService.notifyAccountDeleted).to.have.been
          .calledOnce;
        expect(req.oidc.endSessionUrl).to.have.been.calledOnce;
        expect(res.redirect).to.have.been.calledWith("logout-url");
        expect(
          req.app.locals.sessionStore.destroy.getCall(0).calledWith("session-1")
        ).eq(true);
        expect(
          req.app.locals.sessionStore.destroy.getCall(1).calledWith("session-2")
        ).eq(true);

        expect(
          req.app.locals.subjectSessionIndexService.removeSession
            .getCall(0)
            .calledWith("public-subject-id", "session-1")
        ).eq(true);
        expect(
          req.app.locals.subjectSessionIndexService.removeSession
            .getCall(1)
            .calledWith("public-subject-id", "session-2")
        ).eq(true);
      });
    });

    describe("when supporting DELETE_SERVICE_STORE", () => {
      beforeEach(() => {
        process.env.SUPPORT_DELETE_SERVICE_STORE = "1"
      });
    
      afterEach(() => {
        delete process.env.SUPPORT_DELETE_SERVICE_STORE;
      });
      it("should redirect to deletion confirmed page", async () => {
        req = validRequest();
        const fakeService: DeleteAccountServiceInterface = {
          deleteAccount: sandbox.fake(),
          deleteServiceData: sandbox.fake(),
        };

        const fakePublishingService: GovUkPublishingServiceInterface = {
          notifyAccountDeleted: sandbox.fake.returns(Promise.resolve()),
          notifyEmailChanged: sandbox.fake(),
        };

        req.session.user.email = "test@test.com";
        req.session.user.subjectId = "public-subject-id";
        req.session.user.tokens = { accessToken: "token" };
        req.oidc = {
          endSessionUrl: sandbox.fake.returns("logout-url"),
        };

        await deleteAccountPost(fakeService, fakePublishingService)(
          req as Request,
          res as Response
        );

        expect(fakeService.deleteAccount).to.have.been.calledOnce;
        expect(fakeService.deleteServiceData).to.have.been.calledOnce;
        expect(fakePublishingService.notifyAccountDeleted).to.have.been
          .calledOnce;
        expect(req.oidc.endSessionUrl).to.have.been.calledOnce;
        expect(res.redirect).to.have.been.calledWith("logout-url");
        expect(
          req.app.locals.sessionStore.destroy.getCall(0).calledWith("session-1")
        ).eq(true);
        expect(
          req.app.locals.sessionStore.destroy.getCall(1).calledWith("session-2")
        ).eq(true);

        expect(
          req.app.locals.subjectSessionIndexService.removeSession
            .getCall(0)
            .calledWith("public-subject-id", "session-1")
        ).eq(true);
        expect(
          req.app.locals.subjectSessionIndexService.removeSession
            .getCall(1)
            .calledWith("public-subject-id", "session-2")
        ).eq(true);
      });
    });
  });
});
