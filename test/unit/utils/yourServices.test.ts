import { expect } from "chai";
import { describe } from "mocha";
import {
  formatService,
  containsGovUkPublishingService,
} from "../../../src/utils/yourServices";
import type { Service } from "../../../src/utils/types";

describe("YourService Util", () => {
  describe("format service information to diplay", () => {
    it("It takes a date epoch in seconds and returns a pretty formatted date", async () => {
      const dateEpochInSeconds = 1673358736;
      const serviceFromDb: Service = {
        client_id: "a_client_id",
        count_successful_logins: 1,
        last_accessed: dateEpochInSeconds,
        last_accessed_readable_format: "1673356836",
      };

      const formattedService: Service = formatService(serviceFromDb, "en");

      expect(formattedService.client_id).equal("a_client_id");
      expect(formattedService.count_successful_logins).equal(1);
      expect(formattedService.last_accessed_readable_format).equal(
        "10 January 2023"
      );
    });

    it("format service object with hasDetailedCard if service is hmrc", async () => {
      const dateEpochInSeconds = 1673358736;
      const serviceFromDb: Service = {
        client_id: "hmrc",
        count_successful_logins: 1,
        last_accessed: dateEpochInSeconds,
        last_accessed_readable_format: "1673356836",
      };

      const formattedService: Service = formatService(serviceFromDb, "en");

      expect(formattedService.hasDetailedCard).equal(true);
    });
  });

  describe("does GovUK Publishing service exist in array", async () => {
    it("return false if array does not contain govUK publishing service", () => {
      const serviceList: Service[] = [
        {
          client_id: "client_id",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
        },
      ];
      expect(containsGovUkPublishingService(serviceList)).equal(false);
    });

    it("return true if array contains govUK publishing service", () => {
      const serviceList: Service[] = [
        {
          client_id: "gov-uk",
          count_successful_logins: 1,
          last_accessed: 14567776,
          last_accessed_readable_format: "last_accessed_readable_format",
        },
      ];
      expect(containsGovUkPublishingService(serviceList)).equal(true);
    });
  });
});
