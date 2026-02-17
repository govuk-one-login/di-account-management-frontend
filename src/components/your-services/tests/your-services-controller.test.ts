import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { yourServicesGet } from "../your-services-controller.js";
import { getAppEnv } from "../../../config.js";
import * as configModule from "../../../config.js";
import * as yourServicesModule from "../../../utils/yourServices";

describe("your services controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
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
            getSessions: vi.fn().mockResolvedValue(["session-1", "session-2"]),
          },
        },
      },
      body: {},
      session: {
        user: { subjectId: TEST_SUBJECT_ID, email: "test@test.com" },
        destroy: vi.fn(),
      },
      log: { error: vi.fn() },
      i18n: { language: "en" },
    };
  }

  beforeEach(() => {
    vi.spyOn(configModule, "supportSearchableList").mockReturnValue(true);

    res = {
      render: vi.fn(),
      redirect: vi.fn(() => {}),
      locals: {},
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("yourServicesGet", () => {
    it("should render your services page with data", async () => {
      req = validRequest();
      await yourServicesGet(req as Request, res as Response);
      expect(res.render).toHaveBeenCalledWith("your-services/index.njk", {
        email: "test@test.com",
        currentLngWelsh: false,
        accountsList: [],
        servicesList: [],
        env: getAppEnv(),
        hasEnglishOnlyServices: false,
        searchableListEnabled: true,
      });
    });

    it("should render your services page with email", async () => {
      const req: any = {
        body: {},
        session: {
          user: { email: "test@test.com" },
          destroy: vi.fn(),
        },
      };

      await yourServicesGet(req as Request, res as Response);
      expect(res.render).toHaveBeenCalledWith("your-services/index.njk", {
        email: "test@test.com",
        env: getAppEnv(),
        currentLngWelsh: false,
      });
    });

    it("should render your services page with English-only services flag, if there are English-only accounts", async () => {
      req = validRequest();

      vi.spyOn(yourServicesModule, "presentYourServices").mockImplementation(
        function () {
          return {
            accountsList: [
              {
                client_id: "gov-uk",
                count_successful_logins: 1,
                last_accessed: 12312412532,
                last_accessed_readable_format: "",
                isAvailableInWelsh: false,
              },
            ],
            servicesList: [
              {
                client_id: "veteransCard",
                count_successful_logins: 1,
                last_accessed: 5436437332532,
                last_accessed_readable_format: "",
                isAvailableInWelsh: true,
              },
            ],
          };
        }
      );

      await yourServicesGet(req as Request, res as Response);
      expect(res.render).toHaveBeenCalledWith("your-services/index.njk", {
        email: "test@test.com",
        accountsList: [
          {
            client_id: "gov-uk",
            count_successful_logins: 1,
            last_accessed: 12312412532,
            last_accessed_readable_format: "",
            isAvailableInWelsh: false,
          },
        ],
        servicesList: [
          {
            client_id: "veteransCard",
            count_successful_logins: 1,
            last_accessed: 5436437332532,
            last_accessed_readable_format: "",
            isAvailableInWelsh: true,
          },
        ],
        env: getAppEnv(),
        currentLngWelsh: false,
        hasEnglishOnlyServices: true,
        searchableListEnabled: true,
      });
    });

    it("should render your services page with English-only services flag, if there are English-only services", async () => {
      req = validRequest();

      vi.spyOn(yourServicesModule, "presentYourServices").mockImplementation(
        function () {
          return {
            accountsList: [
              {
                client_id: "gov-uk",
                count_successful_logins: 1,
                last_accessed: 12312412532,
                last_accessed_readable_format: "",
                isAvailableInWelsh: true,
              },
            ],
            servicesList: [
              {
                client_id: "veteransCard",
                count_successful_logins: 1,
                last_accessed: 5436437332532,
                last_accessed_readable_format: "",
                isAvailableInWelsh: false,
              },
            ],
          };
        }
      );

      await yourServicesGet(req as Request, res as Response);
      expect(res.render).toHaveBeenCalledWith("your-services/index.njk", {
        email: "test@test.com",
        accountsList: [
          {
            client_id: "gov-uk",
            count_successful_logins: 1,
            last_accessed: 12312412532,
            last_accessed_readable_format: "",
            isAvailableInWelsh: true,
          },
        ],
        servicesList: [
          {
            client_id: "veteransCard",
            count_successful_logins: 1,
            last_accessed: 5436437332532,
            last_accessed_readable_format: "",
            isAvailableInWelsh: false,
          },
        ],
        env: getAppEnv(),
        currentLngWelsh: false,
        hasEnglishOnlyServices: true,
        searchableListEnabled: true,
      });
    });

    it("shouldn't display a service card for an offboarded service", async () => {
      req = validRequest();

      // Mock presentYourServices to return filtered results
      vi.spyOn(yourServicesModule, "presentYourServices").mockImplementation(
        async () => {
          return {
            accountsList: [
              {
                client_id: "gov-uk",
                count_successful_logins: 1,
                last_accessed: 12312412532,
                last_accessed_readable_format: "23 May 1970",
                isAvailableInWelsh: false,
                hasDetailedCard: false,
              },
            ],
            servicesList: [],
          };
        }
      );

      await yourServicesGet(req as Request, res as Response);
      expect(res.render).toHaveBeenCalledWith("your-services/index.njk", {
        email: "test@test.com",
        accountsList: [
          {
            client_id: "gov-uk",
            count_successful_logins: 1,
            last_accessed: 12312412532,
            last_accessed_readable_format: "23 May 1970",
            isAvailableInWelsh: false,
            hasDetailedCard: false,
          },
        ],
        servicesList: [],
        env: getAppEnv(),
        currentLngWelsh: false,
        hasEnglishOnlyServices: true,
        searchableListEnabled: true,
      });
    });
  });
});
