import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatActivityLogs,
  generatePagination,
  filterAndDecryptActivity,
} from "../../../src/utils/activityHistory.js";
import type { ActivityLogEntry } from "../../../src/utils/types.js";

const createLogEntry = (shouldDisplay = true): ActivityLogEntry => {
  return {
    event_type: "AUTH_AUTH_CODE_ISSUED",
    session_id: "asdf",
    user_id: "1234",
    timestamp: 1689210000,
    client_id: shouldDisplay ? "vehicleOperatorLicense" : "dontshowme",
    event_id: "12345",
    reported_suspicious: false,
    truncated: false,
  };
};

describe("Activity History Util", () => {
  describe("format user activity to display", () => {
    it("returns the correct events for the current page", async () => {
      const longData: ActivityLogEntry[] = new Array(13)
        .fill(0)
        .map(createLogEntry);

      const formattedActivityLogs = formatActivityLogs(
        longData,
        "test",
        2,
        "cy"
      );

      expect(formattedActivityLogs.length).toBe(3);
    });

    it("takes an array of events and the current page and returns formatted data", async () => {
      const data: ActivityLogEntry[] = [
        {
          event_type: "AUTH_AUTH_CODE_ISSUED",
          session_id: "asdf",
          user_id: "1234",
          timestamp: 1689210000,
          client_id: "RqFZ83csmS4Mi4Y7s7ohD9-ekwU",
          event_id: "12345",
          reported_suspicious: false,
          truncated: false,
        },
      ];

      const formattedActivityLogs = formatActivityLogs(
        data,
        "test",
        1,
        "en-GB"
      );

      expect(formattedActivityLogs[0].eventType).toBe("signedIn");
      expect(formattedActivityLogs[0].clientId).toBe(
        "RqFZ83csmS4Mi4Y7s7ohD9-ekwU" //pragma: allowlist secret
      );
      expect(formattedActivityLogs[0].time).toBe("13 July 2023 at 2:00 am");
    });

    it("returns formatted event with isAvailableInWelsh:true if the service is available in Welsh", async () => {
      const data: ActivityLogEntry[] = [
        {
          event_type: "AUTH_AUTH_CODE_ISSUED",
          session_id: "asdf",
          user_id: "1234",
          timestamp: 1689210000,
          client_id: "dbs",
          event_id: "12345",
          reported_suspicious: false,
          truncated: false,
        },
      ];

      const formattedActivityLogs = formatActivityLogs(
        data,
        "test",
        1,
        "en-GB"
      );

      expect(formattedActivityLogs[0].isAvailableInWelsh).toBe(true);
    });

    it("returns formatted event with isAvailableInWelsh:false if the service is not available in Welsh", async () => {
      const data: ActivityLogEntry[] = [
        {
          event_type: "AUTH_AUTH_CODE_ISSUED",
          session_id: "asdf",
          user_id: "1234",
          timestamp: 1689210000,
          client_id: "dfeApplyForTeacherTraining",
          event_id: "12345",
          reported_suspicious: false,
          truncated: false,
        },
      ];

      const formattedActivityLogs = formatActivityLogs(
        data,
        "test",
        1,
        "en-GB"
      );

      expect(formattedActivityLogs[0].isAvailableInWelsh).toBe(false);
    });
  });

  describe("generate a pagination object to render the pagination component", () => {
    it("returns an empty object if no data is provided", () => {
      const data: ActivityLogEntry[] = [];
      const pagination: any = generatePagination(data.length, 1);
      expect(pagination.currentPage).toBe(1);
      expect(pagination.items.length).toBe(0);
    });

    it("does not return pagination items if the length of the data object does not exceed the max number of items allowed per page", () => {
      expect(generatePagination(1, 1)).toEqual({ currentPage: 1 });
    });

    it("returns the expected values if length of the data object exceeds the max number items per page and the current page is the first page", () => {
      const twoPagePagination: any = generatePagination(14, 1);
      expect(twoPagePagination.items).toEqual([1, 2]);
      expect(twoPagePagination.currentPage).toBe(1);
      expect(twoPagePagination.nextPage).toBe(2);
      expect(twoPagePagination.previousPage).toBe(undefined);

      const threePagePagination: any = generatePagination(23, 1);
      expect(threePagePagination.items).toEqual([1, 2, 3]);
      expect(threePagePagination.currentPage).toBe(1);
      expect(threePagePagination.nextPage).toBe(2);
      expect(threePagePagination.previousPage).toBe(undefined);

      const moreThanThreePagePagination: any = generatePagination(55, 1);
      expect(moreThanThreePagePagination.items).toEqual([1, 2, 3]);
      expect(moreThanThreePagePagination.currentPage).toBe(1);
      expect(moreThanThreePagePagination.nextPage).toBe(2);
      expect(moreThanThreePagePagination.previousPage).toBe(undefined);
    });

    it("returns the expected values if length of the data object exceeds the max number items per page and the current page is the last page", () => {
      const twoPagePagination: any = generatePagination(14, 2);
      expect(twoPagePagination.items).toEqual([1, 2]);
      expect(twoPagePagination.currentPage).toBe(2);
      expect(twoPagePagination.nextPage).toBe(undefined);
      expect(twoPagePagination.previousPage).toBe(1);
    });

    it("returns the expected values if length of the data object exceeds the max number items per page and the current page is somewhere in between", () => {
      const pagination: any = generatePagination(44, 3);
      expect(pagination.items).toEqual([2, 3, 4]);
      expect(pagination.currentPage).toBe(3);
      expect(pagination.nextPage).toBe(4);
      expect(pagination.previousPage).toBe(2);
    });

    it("defaults to page 1 if current page argument is invalid", () => {
      const paginationInvalid1: any = generatePagination(55, 1234);
      expect(paginationInvalid1.items).toEqual([1, 2, 3]);
      expect(paginationInvalid1.currentPage).toBe(1);
      expect(paginationInvalid1.nextPage).toBe(2);
      expect(paginationInvalid1.previousPage).toBe(undefined);

      const paginationInvalid2: any = generatePagination(55, -1.444);
      expect(paginationInvalid2.items).toEqual([1, 2, 3]);
      expect(paginationInvalid2.currentPage).toBe(1);
      expect(paginationInvalid2.nextPage).toBe(2);
      expect(paginationInvalid2.previousPage).toBe(undefined);

      const paginationInvalid3: any = generatePagination(55, "blah");
      expect(paginationInvalid3.items).toEqual([1, 2, 3]);
      expect(paginationInvalid3.currentPage).toBe(1);
      expect(paginationInvalid3.nextPage).toBe(2);
      expect(paginationInvalid3.previousPage).toBe(undefined);
    });
  });

  describe("filterAndDecryptActivity", () => {
    let decryptDataStub: ReturnType<typeof vi.fn>;

    const trace = "trace";

    beforeEach(async () => {
      const decryptDataModule = await import(
        "../../../src/utils/decrypt-data.js"
      );
      decryptDataStub = vi.spyOn(decryptDataModule, "decryptData");
      decryptDataStub.mockImplementation((eventType: string) => {
        return eventType;
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("doesn't filter out items with client IDs on the allow list", async () => {
      const activityLogs = [createLogEntry(), createLogEntry()];
      const filtered = await filterAndDecryptActivity(activityLogs, trace);

      expect(filtered.length).toBe(activityLogs.length);
    });

    it("filters out items with client IDs that aren't on the allow list", async () => {
      const activityLogs = [
        createLogEntry(),
        createLogEntry(false),
        createLogEntry(),
      ];
      const filtered = await filterAndDecryptActivity(activityLogs, trace);

      expect(filtered.length).toBe(activityLogs.length - 1);
    });
  });
});
