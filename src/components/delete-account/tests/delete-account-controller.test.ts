import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import {
  deleteAccountGet,
  deleteAccountPost,
} from "../delete-account-controller";
import { DeleteAccountServiceInterface } from "../types";
import { getAppEnv } from "../../../config";
import { Service } from "../../../utils/types";
import { TXMA_AUDIT_ENCODED } from "../../../../test/utils/builders";

describe("delete account controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: any;
  const TEST_SUBJECT_ID = "testSubjectId";

  function validRequest(): any {
    return {
      app: {
        locals: {
          sessionStore: {
            destroy: sandbox.fake(),
          },
          subjectSessionIndexService: {
            removeSession: sandbox.fake(),
            getSessions: sandbox.stub().resolves(["session-1"]),
          },
        },
      },
      body: {},
      session: {
        user: {
          subjectId: TEST_SUBJECT_ID,
          email: "test@test.com",
          state: { deleteAccount: {} },
        },
        destroy: sandbox.fake(),
      },
      log: { error: sandbox.fake() },
      headers: { "txma-audit-encoded": TXMA_AUDIT_ENCODED },
      cookies: { _csrf: "dasdasdas", lo: "false", lng: "en", am: "dsadasdasd" },
    };
  }

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      locals: {},
      clearCookie: sandbox.fake(() => {}),
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("deleteAccountGet", () => {
    it("deleteAccountGetWithoutSubjectId", () => {
      it("should render delete account page", () => {
        const req: any = {
          body: {},
          session: {
            user: { email: "test@test.com" },
            destroy: sandbox.fake(),
          },
        };

        deleteAccountGet(req as Request, res as Response);
        expect(res.render).to.have.calledWith("delete-account/index.njk", {
          env: getAppEnv(),
        });
      });
    });

    it("deleteAccountGetWithoutServices", () => {
      it("should render delete account page", () => {
        req = validRequest();
        const yourServices = require("../../../utils/yourServices");
        sandbox
          .stub(yourServices, "getAllowedListServices")
          .callsFake(function (): Service[] {
            return [];
          });

        deleteAccountGet(req as Request, res as Response);
        expect(res.render).to.have.calledWith("delete-account/index.njk", {
          servicesList: [],
          env: getAppEnv(),
        });
      });
    });

    it("deleteAccountGetWithServices", () => {
      const serviceList: Service[] = [
        {
          client_id: "client_id",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
        },
      ];

      it("should render the delete account page with list of services used", () => {
        req = validRequest();
        const yourServices = require("../../../utils/yourServices");
        sandbox
          .stub(yourServices, "getAllowedListServices")
          .callsFake(function (): Service[] {
            return serviceList;
          });

        deleteAccountGet(req as Request, res as Response);
        expect(res.render).to.have.calledWith("delete-account/index.njk", {
          servicesList: serviceList,
          env: getAppEnv(),
        });
      });
    });
  });

  describe("deleteAccountPost", () => {
    describe("when supporting DELETE_SERVICE_STORE", () => {
      it("should redirect to deletion confirmed page", async () => {
        req = validRequest();
        const fakeService: DeleteAccountServiceInterface = {
          deleteAccount: sandbox.fake.resolves(true),
          publishToDeleteTopic: sandbox.fake(),
        };

        req.session.user.email = "test@test.com";
        req.session.user.subjectId = "public-subject-id";
        req.session.user.tokens = { accessToken: "token" } as any;
        req.oidc = {
          endSessionUrl: sandbox.fake.returns("logout-url"),
        } as any;

        const sessionStore = require("../../../utils/session-store");
        sandbox.stub(sessionStore, "destroyUserSessions").resolves();

        await deleteAccountPost(fakeService)(req as Request, res as Response);

        expect(fakeService.deleteAccount).to.have.been.calledOnce;
        expect(fakeService.publishToDeleteTopic).to.have.been.calledOnce;
        expect(req.oidc.endSessionUrl).to.have.been.calledOnce;
        expect(res.redirect).to.have.been.calledWith("logout-url");
        expect(sessionStore.destroyUserSessions).to.have.been.calledWith(
          req,
          "public-subject-id"
        );
      });
      it("should clear am cookie", async () => {
        req = validRequest();
        const fakeService: DeleteAccountServiceInterface = {
          deleteAccount: sandbox.fake.resolves(true),
          publishToDeleteTopic: sandbox.fake(),
        };
        req.session.user.tokens = { accessToken: "token" } as any;
        req.oidc = {
          endSessionUrl: sandbox.fake.returns("logout-url"),
        } as any;

        await deleteAccountPost(fakeService)(req as Request, res as Response);
        expect(res.clearCookie).to.have.calledWith("am");
      });
    });
  });
});
