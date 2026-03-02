import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import {
  deleteAccountGet,
  deleteAccountPost,
} from "../delete-account-controller.js";
import { DeleteAccountServiceInterface } from "../types";
import { getAppEnv } from "../../../config.js";
import { Service } from "../../../utils/types";
import { TXMA_AUDIT_ENCODED } from "../../../../test/utils/builders";
import * as oidcModule from "../../../utils/oidc.js";
import * as yourServicesModule from "../../../utils/yourServices";
import * as sessionStoreModule from "../../../utils/session-store.js";

describe("delete account controller", () => {
  let req: Partial<Request>;
  let res: any;
  const TEST_SUBJECT_ID = "testSubjectId";

  function validRequest(): any {
    return {
      app: {
        locals: {
          sessionStore: {
            destroy: vi.fn(),
          },
          subjectSessionIndexService: {
            removeSession: vi.fn(),
            getSessions: vi.fn().mockResolvedValue(["session-1"]),
          },
        },
      },
      body: {},
      cookies: {},
      query: { from: "security" },
      session: {
        user: {
          subjectId: TEST_SUBJECT_ID,
          email: "test@test.com",
          state: { deleteAccount: {} },
        },
        destroy: vi.fn(),
      },
      log: { error: vi.fn() },
      headers: { "txma-audit-encoded": TXMA_AUDIT_ENCODED },
    };
  }

  beforeEach(() => {
    res = {
      render: vi.fn(),
      clearCookie: vi.fn(),
      redirect: vi.fn(() => {}),
      locals: {},
    };
    vi.spyOn(oidcModule, "refreshToken").mockImplementation(async () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("deleteAccountGet", () => {
    describe("deleteAccountGetWithoutSubjectId", () => {
      it("should render delete account page", async () => {
        const req: any = {
          body: {},
          session: {
            user: { email: "test@test.com" },
            destroy: vi.fn(),
          },
        };

        await deleteAccountGet(req as Request, res as Response);
        expect(res.render).toHaveBeenCalledWith("delete-account/index.njk", {
          env: getAppEnv(),
        });
      });
    });

    describe("deleteAccountGetWithoutServices", () => {
      it("should render delete account page without services", async () => {
        req = validRequest();
        vi.spyOn(
          yourServicesModule,
          "getYourServicesForAccountDeletion"
        ).mockReturnValue([]);

        await deleteAccountGet(req as Request, res as Response);
        expect(res.render).toHaveBeenCalledWith("delete-account/index.njk", {
          services: [],
          env: getAppEnv(),
          currentLngWelsh: false,
          hasEnglishOnlyServices: false,
          fromSecurity: true,
        });
      });
    });

    describe("deleteAccountGetNotFromSecurity", () => {
      it("should render delete page without fromSecurity parameter if query string not present/invalid", async () => {
        req = validRequest();
        req.query.from = "invalidValue";
        vi.spyOn(
          yourServicesModule,
          "getYourServicesForAccountDeletion"
        ).mockReturnValue([]);

        await deleteAccountGet(req as Request, res as Response);
        expect(res.render).toHaveBeenCalledWith("delete-account/index.njk", {
          services: [],
          env: getAppEnv(),
          currentLngWelsh: false,
          hasEnglishOnlyServices: false,
          fromSecurity: false,
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
        vi.spyOn(
          yourServicesModule,
          "getYourServicesForAccountDeletion"
        ).mockReturnValue(serviceList);

        await deleteAccountGet(req as Request, res as Response);
        expect(res.render).toHaveBeenCalledWith("delete-account/index.njk", {
          services: serviceList,
          env: getAppEnv(),
          currentLngWelsh: false,
          hasEnglishOnlyServices: true,
          fromSecurity: true,
        });
      });
    });
  });

  describe("deleteAccountPost", () => {
    describe("when supporting DELETE_SERVICE_STORE", () => {
      it("should redirect to deletion confirmed page", async () => {
        req = validRequest();
        const fakeService: DeleteAccountServiceInterface = {
          deleteAccount: vi.fn().mockResolvedValue(true),
          publishToDeleteTopic: vi.fn(),
        };

        req.session.user.email = "test@test.com";
        req.session.user.subjectId = "public-subject-id";
        req.session.user.tokens = { accessToken: "token" } as any;
        req.session.user.state.deleteAccount.value = "CHANGE_VALUE";
        req.oidc = {
          endSessionUrl: vi.fn().mockReturnValue("logout-url"),
        } as any;

        vi.spyOn(sessionStoreModule, "destroyUserSessions").mockResolvedValue();

        await deleteAccountPost(fakeService)(req as Request, res as Response);

        expect(fakeService.deleteAccount).toHaveBeenCalledTimes(1);
        expect(fakeService.publishToDeleteTopic).toHaveBeenCalledTimes(1);
        expect(req.oidc.endSessionUrl).toHaveBeenCalledTimes(1);
        expect(res.redirect).toHaveBeenCalledWith("logout-url");
        expect(sessionStoreModule.destroyUserSessions).toHaveBeenCalledWith(
          req,
          "public-subject-id",
          expect.anything()
        );
      });
    });
  });
});
