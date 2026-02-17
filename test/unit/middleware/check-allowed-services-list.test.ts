import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextFunction } from "express";
import {
  checkRSAAllowedServicesList,
  findClientInServices,
} from "../../../src/middleware/check-allowed-services-list.js";
import * as yourServices from "../../../src/utils/yourServices.js";
import * as allowListFuncs from "../../../src/middleware/check-allowed-services-list.js";
import { LOG_MESSAGES, PATH_DATA } from "../../../src/app.constants.js";

describe("activity history allowlist middleware", () => {
  beforeEach(() => {});

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkRSAAllowedServicesList function", () => {
    it("calls next function if list of user services contains RSA allowlisted RPs", async () => {
      // mortgageDeed is on the allow list so this should pass
      const yourNewServices = [
        {
          client_id: "prisonVisits",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
          hasDetailedCard: true,
        },
        {
          client_id: "mortgageDeed",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
          hasDetailedCard: true,
        },
      ];
      const yourNewAllowlist = ["prisonVisits"];
      const containsRps = findClientInServices(
        yourNewAllowlist,
        yourNewServices
      );
      vi.spyOn(yourServices, "getServices").mockResolvedValue(yourNewServices);

      vi.spyOn(allowListFuncs, "findClientInServices").mockReturnValue(
        containsRps
      );
      const req: any = {
        session: {
          user: {
            isAuthenticated: false,
          } as any,
        },
        cookies: {
          lo: "true",
        },
        log: {
          info: vi.fn(),
        },
      };

      const res: any = { locals: {}, redirect: vi.fn() };
      expect(containsRps).equal(true);
      const nextFunction: NextFunction = vi.fn(() => {});
      await checkRSAAllowedServicesList(req, res, nextFunction);
      expect(nextFunction).toHaveBeenCalledOnce();
    });

    it("redirects if list of user services does not contain RSA allowlisted RPs", async () => {
      vi.spyOn(yourServices, "getServices").mockResolvedValue([
        {
          client_id: "smokeTests",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
          hasDetailedCard: true,
        },
        {
          client_id: "relyingPartyStub",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
          hasDetailedCard: true,
        },
      ]);
      const req: any = {
        session: {
          user: {
            isAuthenticated: false,
          } as any,
        },
        cookies: {
          lo: "true",
        },
        log: {
          info: vi.fn(),
        },
      };

      const res: any = { locals: { trace: {} }, redirect: vi.fn() };
      const nextFunction: NextFunction = vi.fn(() => {});
      await checkRSAAllowedServicesList(req, res, nextFunction);
      expect(res.redirect).toHaveBeenCalledWith(PATH_DATA.SECURITY.url);
      expect(req.log.info).toHaveBeenCalledWith(
        { trace: {} },
        LOG_MESSAGES.ILLEGAL_ATTEMPT_TO_ACCESS_RSA
      );
    });
  });
});
