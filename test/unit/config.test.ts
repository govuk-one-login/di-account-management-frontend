import { expect } from "chai";
import { describe } from "mocha";

import {
  getListOfAccountClientIDs,
  getListOfServiceClientIDs,
} from "../../src/config";

describe("config", () => {
  describe("Service configuration", () => {
    it("should have no services in the accounts list that are in the other services list", () => {
      expect(
        getListOfAccountClientIDs.filter((service) =>
          getListOfServiceClientIDs.includes(service)
        ).length
      ).to.eq(0);
    });

    it("should have no services in the other services list that are in the accounts list", () => {
      expect(
        getListOfServiceClientIDs.filter((service) =>
          getListOfAccountClientIDs.includes(service)
        ).length
      ).to.eq(0);
    });
  });
});
