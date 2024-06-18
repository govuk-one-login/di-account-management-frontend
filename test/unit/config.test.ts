import {
  getAllowedAccountListClientIDs,
  getAllowedServiceListClientIDs,
} from "../../src/config.js";

describe("config", () => {
  describe("Service configuration", () => {
    it("should have no services in the accounts list that are in the other services list", () => {
      expect(
        getAllowedAccountListClientIDs.filter((service) =>
          getAllowedServiceListClientIDs.includes(service)
        ).length
      ).toEqual(0);
    });

    it("should have no services in the other services list that are in the accounts list", () => {
      expect(
        getAllowedServiceListClientIDs.filter((service) =>
          getAllowedAccountListClientIDs.includes(service)
        ).length
      ).toEqual(0);
    });
  });
});
