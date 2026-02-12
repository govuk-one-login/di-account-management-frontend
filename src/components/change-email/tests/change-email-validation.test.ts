import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateChangeEmailRequest } from "../change-email-validation.js";
import { Request } from "express";

describe("change-email-validation", () => {
  let req: Partial<Request>;

  beforeEach(() => {
    req = {
      body: {},
      t: vi.fn((key: string) => key),
    } as Partial<Request>;
  });

  describe("validateChangeEmailRequest", () => {
    it("should return validation chain with body validator and middleware", () => {
      const validationChain = validateChangeEmailRequest();

      expect(validationChain).toBeDefined();
      expect(Array.isArray(validationChain)).toBe(true);
      expect(validationChain.length).toBe(2);
    });

    it("should validate email is not empty", async () => {
      const validationChain = validateChangeEmailRequest();
      const bodyValidator = validationChain[0];

      req.body = { email: "" };

      await bodyValidator.run(req as Request);

      expect(req.t).toHaveBeenCalledWith(
        "pages.changeEmail.email.validationError.required",
        expect.any(Object)
      );
    });

    it("should validate email length is not more than 256 characters", async () => {
      const validationChain = validateChangeEmailRequest();
      const bodyValidator = validationChain[0];

      req.body = { email: "a".repeat(257) + "@test.com" };

      await bodyValidator.run(req as Request);

      expect(req.t).toHaveBeenCalledWith(
        "pages.changeEmail.email.validationError.length",
        expect.any(Object)
      );
    });

    it("should validate email format", async () => {
      const validationChain = validateChangeEmailRequest();
      const bodyValidator = validationChain[0];

      req.body = { email: "invalid-email" };

      await bodyValidator.run(req as Request);

      expect(req.t).toHaveBeenCalledWith(
        "pages.changeEmail.email.validationError.email",
        expect.any(Object)
      );
    });

    it("should accept valid email", async () => {
      const validationChain = validateChangeEmailRequest();
      const bodyValidator = validationChain[0];

      req.body = { email: "test@example.com" };

      await bodyValidator.run(req as Request);

      // Valid email should not trigger validation errors
      expect(req.t).not.toHaveBeenCalled();
    });

    it("should normalize email while preserving dots in Gmail", async () => {
      const validationChain = validateChangeEmailRequest();
      const bodyValidator = validationChain[0];

      req.body = { email: "Test.User@Gmail.Com" };

      await bodyValidator.run(req as Request);

      // Email should be normalized to lowercase but dots preserved
      expect(req.body.email).toBe("test.user@gmail.com");
    });

    it("should normalize email while preserving subaddress in Gmail", async () => {
      const validationChain = validateChangeEmailRequest();
      const bodyValidator = validationChain[0];

      req.body = { email: "Test+subaddress@Gmail.Com" };

      await bodyValidator.run(req as Request);

      // Email should be normalized to lowercase but subaddress preserved
      expect(req.body.email).toBe("test+subaddress@gmail.com");
    });

    it("should normalize email while preserving subaddress in Outlook", async () => {
      const validationChain = validateChangeEmailRequest();
      const bodyValidator = validationChain[0];

      req.body = { email: "Test+subaddress@Outlook.Com" };

      await bodyValidator.run(req as Request);

      // Email should be normalized to lowercase but subaddress preserved
      expect(req.body.email).toBe("test+subaddress@outlook.com");
    });

    it("should normalize email while preserving subaddress in iCloud", async () => {
      const validationChain = validateChangeEmailRequest();
      const bodyValidator = validationChain[0];

      req.body = { email: "Test+subaddress@iCloud.Com" };

      await bodyValidator.run(req as Request);

      // Email should be normalized to lowercase but subaddress preserved
      expect(req.body.email).toBe("test+subaddress@icloud.com");
    });

    it("should convert googlemail.com to gmail.com", async () => {
      const validationChain = validateChangeEmailRequest();
      const bodyValidator = validationChain[0];

      req.body = { email: "test@googlemail.com" };

      await bodyValidator.run(req as Request);

      // googlemail.com should be converted to gmail.com
      expect(req.body.email).toBe("test@gmail.com");
    });

    it("should trim whitespace from email", async () => {
      const validationChain = validateChangeEmailRequest();
      const bodyValidator = validationChain[0];

      req.body = { email: "  test@example.com  " };

      await bodyValidator.run(req as Request);

      // Whitespace should be trimmed
      expect(req.body.email).toBe("test@example.com");
    });
  });
});
