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
import * as oidcModule from "../../../utils/oidc";

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
      cookies: {},
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
    };
  }

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      locals: {},
    };
    sandbox.replace(oidcModule, "refreshToken", async () => {});
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("deleteAccountGet", () => {
    describe("deleteAccountGetWithoutSubjectId", () => {
      it("should render delete account page", async () => {
        const req: any = {
          body: {},
          session: {
            user: { email: "test@test.com" },
            destroy: sandbox.fake(),
          },
        };

        await deleteAccountGet(req as Request, res as Response);
        expect(res.render).to.have.calledWith("delete-account/index.njk", {
          env: getAppEnv(),
        });
      });
    });

    describe("deleteAccountGetWithoutServices", () => {
      it("should render delete account page without services", async () => {
        req = validRequest();
        const yourServices = require("../../../utils/yourServices");
        sandbox
          .stub(yourServices, "getYourServicesForAccountDeletion")
          .callsFake(function (): Service[] {
            return [];
          });

        await deleteAccountGet(req as Request, res as Response);
        expect(res.render).to.have.calledWith("delete-account/index.njk", {
          hasGovUkEmailSubscription: false,
          services: [],
          env: getAppEnv(),
          currentLngWelsh: false,
          hasEnglishOnlyServices: false,
        });
      });
    });

    describe("deleteAccountGetWithServices", () => {
      const serviceList: Service[] = [
        {
          client_id: "client_id",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
        },
      ];

      it("should render the delete account page with list of services used", async () => {
        req = validRequest();
        const yourServices = require("../../../utils/yourServices");
        sandbox
          .stub(yourServices, "getYourServicesForAccountDeletion")
          .callsFake(function (): Service[] {
            return serviceList;
          });

        await deleteAccountGet(req as Request, res as Response);
        expect(res.render).to.have.calledWith("delete-account/index.njk", {
          services: serviceList,
          env: getAppEnv(),
          hasGovUkEmailSubscription: false,
          currentLngWelsh: false,
          hasEnglishOnlyServices: true,
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
        req.session.user.state.deleteAccount.value = "CHANGE_VALUE";
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
        sessionStore.destroyUserSessions.restore();
      });
    });
  });
});
