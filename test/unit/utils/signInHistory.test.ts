import { expect } from "chai";
import { describe } from "mocha";
import {
  formatData,
  generatePagination,
  hasExplanationParagraph,
} from "../../../src/utils/signInHistory";
import type { ActivityLogEntry } from "../../../src/utils/types";

describe("Sign in History Util", () => {
  describe("show a paragraph explaining the feature where appropriate", () => {
    it("flag is false when the earliest event in the log is newer than feature launch date", async () => {
      const data: ActivityLogEntry[] = [
        {
          event_type: "AUTH_AUTH_CODE_ISSUED",
          session_id: "asdf",
          user_id: "1234",
          // Thu Nov 25 2032
          timestamp: 1985032269060,
          client_id: "12345",
          event_id: "12345",
          reported_suspicious: false,
        },
      ];

      expect(hasExplanationParagraph(data)).equal(false);
    });

    it("flag is true when the earliest event in the log is older than feature launch date", async () => {
      const data: ActivityLogEntry[] = [
        {
          event_type: "AUTH_AUTH_CODE_ISSUED",
          session_id: "asdf",
          user_id: "1234",
          // Sun Jan 29 2023
          timestamp: 1675032269060,
          client_id: "12345",
          event_id: "12345",
          reported_suspicious: false,
        },
      ];

      expect(hasExplanationParagraph(data)).equal(true);
    });
  });

  describe("format user activity to display", () => {
    it("returns the correct events for the current page", async () => {
      const createLogEntry = (): ActivityLogEntry => {
        return {
          event_type: "AUTH_AUTH_CODE_ISSUED",
          session_id: "asdf",
          user_id: "1234",
          timestamp: 1689210000,
          client_id: "dontshowme",
          event_id: "12345",
          reported_suspicious: false,
        };
      };

      const longData: ActivityLogEntry[] = new Array(13)
        .fill(0)
        .map(createLogEntry);

      const FormattedActivityLog = await formatData(longData, 2, "cy");

      expect(FormattedActivityLog.length).equal(3);
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
        },
      ];

      const FormattedActivityLog = await formatData(data, 1, "en-GB");

      expect(FormattedActivityLog[0].eventType).equal("signedIn");
      expect(FormattedActivityLog[0].clientId).equal(
        "RqFZ83csmS4Mi4Y7s7ohD9-ekwU"
      );
      expect(FormattedActivityLog[0].time).equal("13 July 2023 at 2:00 am");
    });
  });

  describe("generate a pagination object to render the pagination component", async () => {
    it("returns an empty object if no data is provided", () => {
      const data = [];
      const pagination: any = generatePagination(data.length, 1);
      expect(pagination.currentPage).to.equal(1);
      expect(pagination.items.length).to.equal(0);
    });

    it("does not return pagination items if the length of the data object does not exceed the max number of items allowed per page", () => {
      expect(generatePagination(1, 1)).to.deep.equal({ currentPage: 1 });
    });

    it("returns the expected values if length of the data object exceeds the max number items per page and the current page is the first page", () => {
      const twoPagePagination: any = generatePagination(14, 1);
      expect(twoPagePagination.items).to.deep.equal([1, 2]);
      expect(twoPagePagination.currentPage).equal(1);
      expect(twoPagePagination.nextPage).equal(2);
      expect(twoPagePagination.previousPage).equal(undefined);

      const threePagePagination: any = generatePagination(23, 1);
      expect(threePagePagination.items).to.deep.equal([1, 2, 3]);
      expect(threePagePagination.currentPage).equal(1);
      expect(threePagePagination.nextPage).equal(2);
      expect(threePagePagination.previousPage).equal(undefined);

      const moreThanThreePagePagination: any = generatePagination(55, 1);
      expect(moreThanThreePagePagination.items).to.deep.equal([1, 2, 3]);
      expect(moreThanThreePagePagination.currentPage).equal(1);
      expect(moreThanThreePagePagination.nextPage).equal(2);
      expect(moreThanThreePagePagination.previousPage).equal(undefined);
    });

    it("returns the expected values if length of the data object exceeds the max number items per page and the current page is the last page", () => {
      const twoPagePagination: any = generatePagination(14, 2);
      expect(twoPagePagination.items).to.deep.equal([1, 2]);
      expect(twoPagePagination.currentPage).equal(2);
      expect(twoPagePagination.nextPage).equal(undefined);
      expect(twoPagePagination.previousPage).equal(1);
    });

    it("returns the expected values if length of the data object exceeds the max number items per page and the current page is somewhere in between", () => {
      const pagination: any = generatePagination(44, 3);
      expect(pagination.items).to.deep.equal([2, 3, 4]);
      expect(pagination.currentPage).equal(3);
      expect(pagination.nextPage).equal(4);
      expect(pagination.previousPage).equal(2);
    });

    it("defaults to page 1 if current page argument is invalid", () => {
      const paginationInvalid1: any = generatePagination(55, 1234);
      expect(paginationInvalid1.items).to.deep.equal([1, 2, 3]);
      expect(paginationInvalid1.currentPage).equal(1);
      expect(paginationInvalid1.nextPage).equal(2);
      expect(paginationInvalid1.previousPage).equal(undefined);

      const paginationInvalid2: any = generatePagination(55, -1.444);
      expect(paginationInvalid2.items).to.deep.equal([1, 2, 3]);
      expect(paginationInvalid2.currentPage).equal(1);
      expect(paginationInvalid2.nextPage).equal(2);
      expect(paginationInvalid2.previousPage).equal(undefined);

      const paginationInvalid3: any = generatePagination(55, "blah");
      expect(paginationInvalid3.items).to.deep.equal([1, 2, 3]);
      expect(paginationInvalid3.currentPage).equal(1);
      expect(paginationInvalid3.nextPage).equal(2);
      expect(paginationInvalid3.previousPage).equal(undefined);
    });
  });
});
