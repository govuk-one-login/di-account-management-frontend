import { describe, it, expect } from "vitest";
import {
  getListOfAccountClientIDs,
  getListOfServiceClientIDs,
} from "../../src/config.js";

describe("config", () => {
  describe("Service configuration", () => {
    it("should have no services in the accounts list that are in the other services list", () => {
      expect(
        getListOfAccountClientIDs.filter((service) =>
          getListOfServiceClientIDs.includes(service)
        ).length
      ).toBe(0);
    });

    it("should have no services in the other services list that are in the accounts list", () => {
      expect(
        getListOfServiceClientIDs.filter((service) =>
          getListOfAccountClientIDs.includes(service)
        ).length
      ).toBe(0);
    });
  });
});
