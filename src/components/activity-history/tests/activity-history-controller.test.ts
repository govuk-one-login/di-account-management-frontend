import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { PATH_DATA, EXTERNAL_URLS } from "../../../app.constants.js";
import { activityHistoryGet } from "../activity-history-controller.js";
import { getAppEnv, reportSuspiciousActivity } from "../../../config.js";
import { logger } from "../../../utils/logger.js";
import * as presentActivityHistoryModule from "../../../utils/present-activity-history.js";

describe("Activity history controller", () => {
  let res: Partial<Response>;
  const TEST_SUBJECT_ID = "testSubjectId";
  let errorLoggerSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.APP_ENV = "local";
    res = {
      render: vi.fn(),
      locals: { sessionId: "testSessionId" },
      status: vi.fn(),
    };
    errorLoggerSpy = vi.spyOn(logger, "error");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sign in history get", () => {
    it("should render the sign in history page with data", async () => {
      vi.spyOn(
        presentActivityHistoryModule,
        "presentActivityHistory"
      ).mockResolvedValue([]);
      const clientId = "clientId";
      vi.spyOn(
        { getOIDCClientId: () => "" } as any,
        "getOIDCClientId"
      ).mockImplementation(() => {
        return clientId;
      });

      const req: any = {
        app: {
          locals: {
            sessionStore: {
              destroy: vi.fn(),
            },
            subjectSessionIndexService: {
              removeSession: vi.fn(),
              getSessions: vi
                .fn()
                .mockResolvedValue(["session-1", "session-2"]),
            },
          },
        },
        body: {},
        session: {
          user: { subjectId: TEST_SUBJECT_ID },
          query: {},
          destroy: vi.fn(),
        },
        log: { error: vi.fn(), info: vi.fn() },
        i18n: { language: "en" },
        t: (k: string) => k,
      };
      await activityHistoryGet(req as Request, res as Response).then(() => {
        expect(res.render).toHaveBeenCalled();
        expect(res.render).toHaveBeenCalledWith("activity-history/index.njk", {
          env: getAppEnv(),
          reportSuspiciousActivity: reportSuspiciousActivity(),
          data: [],
          pagination: {},
          backLink: PATH_DATA.SECURITY.url,
          changePasswordLink: PATH_DATA.SECURITY.url,
          contactLink: EXTERNAL_URLS.AUTH_REPORTING_FORM,
          homeClientId: "test-client-id",
          hasEnglishOnlyServices: false,
          currentLngWelsh: false,
        });
      });
    });

    it("should render with hasEnglishOnlyServices: true if data contains an English-only service", async () => {
      vi.spyOn(
        presentActivityHistoryModule,
        "presentActivityHistory"
      ).mockReturnValue([
        {
          event_type: "AUTH_AUTH_CODE_ISSUED",
          session_id: "asdf",
          user_id: "string",
          timestamp: "1689210000",
          truncated: false,
          client_id: "apprenticeshipsService",
        },
      ]);

      const clientId = "clientId";
      vi.spyOn(
        { getOIDCClientId: () => "" } as any,
        "getOIDCClientId"
      ).mockImplementation(() => {
        return clientId;
      });

      const req: any = {
        app: {
          locals: {
            sessionStore: {
              destroy: vi.fn(),
            },
            subjectSessionIndexService: {
              removeSession: vi.fn(),
              getSessions: vi
                .fn()
                .mockResolvedValue(["session-1", "session-2"]),
            },
          },
        },
        body: {},
        session: {
          user: { subjectId: TEST_SUBJECT_ID },
          query: {},
          destroy: vi.fn(),
        },
        log: { error: vi.fn(), info: vi.fn() },
        t: (k: string) => k,
      };
      await activityHistoryGet(req as Request, res as Response).then(() => {
        expect(res.render).toHaveBeenCalled();
        expect(res.render).toHaveBeenCalledWith("activity-history/index.njk", {
          env: getAppEnv(),
          reportSuspiciousActivity: reportSuspiciousActivity(),
          data: [
            {
              eventType: "signedIn",
              eventId: undefined,
              sessionId: "asdf",
              clientId: "apprenticeshipsService",
              reportedSuspicious: undefined,
              reportSuspiciousActivityUrl:
                "/activity-history/report-activity?event=undefined&page=1",
              time: "13 July 2023 at 2:00 am",
              visitedService: "apprenticeshipsService",
              visitedServiceId: "apprenticeshipsService",
              reportNumber: undefined,
              isAvailableInWelsh: false,
            },
          ],
          pagination: {},
          backLink: PATH_DATA.SECURITY.url,
          changePasswordLink: PATH_DATA.SECURITY.url,
          contactLink: EXTERNAL_URLS.AUTH_REPORTING_FORM,
          homeClientId: "test-client-id",
          hasEnglishOnlyServices: true,
          currentLngWelsh: false,
        });
      });
    });

    it("should render error when user id is missing", async () => {
      vi.spyOn(
        presentActivityHistoryModule,
        "presentActivityHistory"
      ).mockResolvedValue([]);

      const clientId = "clientId";
      vi.spyOn(
        { getOIDCClientId: () => "" } as any,
        "getOIDCClientId"
      ).mockImplementation(() => {
        return clientId;
      });

      const req: any = {
        app: {
          locals: {
            sessionStore: {
              destroy: vi.fn(),
            },
            subjectSessionIndexService: {
              removeSession: vi.fn(),
              getSessions: vi
                .fn()
                .mockResolvedValue(["session-1", "session-2"]),
            },
          },
        },
        body: {},
        session: {
          user: { subjectId: undefined },
          query: {},
          destroy: vi.fn(),
        },
        log: { error: vi.fn(), info: vi.fn() },
        i18n: { language: "en" },
        t: (k: string) => k,
      };
      await activityHistoryGet(req as Request, res as Response);
      expect(errorLoggerSpy).toHaveBeenCalledWith(
        "Activity history controller: user_id missing from session"
      );
    });

    it("should render error during activity history get", async () => {
      vi.spyOn(
        presentActivityHistoryModule,
        "presentActivityHistory"
      ).mockResolvedValue(new Error("An error occurred") as any);

      const clientId = "clientId";
      vi.spyOn(
        { getOIDCClientId: () => "" } as any,
        "getOIDCClientId"
      ).mockImplementation(() => {
        return clientId;
      });

      const req: any = {
        app: {
          locals: {
            sessionStore: {
              destroy: vi.fn(),
            },
            subjectSessionIndexService: {
              removeSession: vi.fn(),
              getSessions: vi
                .fn()
                .mockResolvedValue(["session-1", "session-2"]),
            },
          },
        },
        body: {},
        session: {
          user: { subjectId: TEST_SUBJECT_ID },
          query: {},
          destroy: vi.fn(),
        },
        log: { error: vi.fn(), info: vi.fn() },
        i18n: { language: "en" },
        t: (k: string) => k,
      };
      await activityHistoryGet(req as Request, res as Response).then(() => {
        expect(errorLoggerSpy).toHaveBeenCalledWith(
          "Activity-history-controller: Error during activity history get TypeError: activityLogs is not iterable"
        );
        expect(res.render).toHaveBeenCalled();
        expect(res.render).toHaveBeenCalledWith("common/errors/500.njk");
      });
    });
  });
});
