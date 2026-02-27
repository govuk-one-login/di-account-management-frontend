import { it, describe, expect } from "vitest";
import { getRefererFrom } from "../../src/utils/logger.js";

describe("logger", () => {
  describe("getRefererFrom", () => {
    it("should return path from a url", () => {
      expect(getRefererFrom("http://localhost:8080/hello")).toBe("/hello");
    });

    it("should return path from a gov.uk url", () => {
      expect(getRefererFrom("http://gov.uk/hello")).toBe("/hello");
    });

    it("should return path from an https gov.uk url", () => {
      expect(getRefererFrom("https://gov.uk/hello")).toBe("/hello");
    });

    it("should return path from a url without port", () => {
      expect(getRefererFrom("http://localhost/hello")).toBe("/hello");
    });

    it("should return a longer path from a url", () => {
      expect(getRefererFrom("http://localhost:8080/hello/good/morning")).toBe(
        "/hello/good/morning"
      );
    });

    it("should return path and query from a url", () => {
      expect(getRefererFrom("http://localhost:8080/hello?world=true")).toBe(
        "/hello?world=true"
      );
    });

    it("should return query only from a url", () => {
      expect(getRefererFrom("http://localhost:8080?world=true")).toBe(
        "/?world=true"
      );
    });

    it("should return a longer path and query from a url", () => {
      expect(
        getRefererFrom("http://localhost:8080/hello/good/morning?world=true")
      ).toBe("/hello/good/morning?world=true");
    });

    it("should return a longer path and two query params from a url", () => {
      expect(
        getRefererFrom(
          "http://localhost:8080/hello/good/morning?world=true&morning=good"
        )
      ).toBe("/hello/good/morning?world=true&morning=good");
    });

    it("should return empty path from a url", () => {
      expect(getRefererFrom("http://localhost:8080")).toBe("/");
    });

    it("should return empty path from a url ending with /", () => {
      expect(getRefererFrom("http://localhost:8080/")).toBe("/");
    });

    it("should return undefined for null url", () => {
      expect(getRefererFrom(null)).toBe(undefined);
    });

    it("should return undefined for undefined url", () => {
      expect(getRefererFrom(undefined)).toBe(undefined);
    });

    it("should return undefined for invalid url", () => {
      expect(getRefererFrom("hello")).toBe(undefined);
    });

    it("should return undefined for invalid protocol", () => {
      expect(getRefererFrom("https;//hello")).toBe(undefined);
    });

    it("should return undefined for invalid port", () => {
      expect(getRefererFrom("https://localhost:hello")).toBe(undefined);
    });
  });
});
