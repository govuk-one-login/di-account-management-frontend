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
import { destroyUserSessions } from "../../../utils/session-store";
import { getAppEnv } from "../../../config";
import { Service } from "../../../utils/types";

describe("delete account controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
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
          manageEmailsLink: "https://www.gov.uk/email/manage",
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
          .callsFake(function (): Service[] { return []; });

        deleteAccountGet(req as Request, res as Response);
        expect(res.render).to.have.calledWith("delete-account/index.njk", {
          manageEmailsLink: "https://www.gov.uk/email/manage",
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
          manageEmailsLink: "https://www.gov.uk/email/manage",
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

        const sessionStore = require("../../../utils/session-store");
        sandbox.stub(sessionStore, "destroyUserSessions").resolves();

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
        expect(destroyUserSessions).to.have.been.calledWith(
          "public-subject-id"
        );
      });
    });
  });
});
