import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request } from "express";
import { validationResult } from "express-validator";
import { RequestBuilder } from "../../../../test/utils/builders";
import { validateChangePasswordRequest } from "../change-password-validation.js";
import { ValidationChainFunc } from "../../../types";
import * as formValidationMiddleware from "../../../middleware/form-validation-middleware.js";

describe("change password validation", () => {
  let req: Partial<Request>;
  let validators: ValidationChainFunc;

  beforeEach(() => {
    req = new RequestBuilder()
      .withTranslate(vi.fn().mockReturnValue("validation error"))
      .build();

    const stub = vi.spyOn(formValidationMiddleware, "validateBodyMiddleware");
    stub.mockReturnValue(() => {});

    validators = validateChangePasswordRequest();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validateChangePasswordRequest", () => {
    it("should pass validation with valid password and matching confirmation", async () => {
      req.body = {
        password: "Password123",
        "confirm-password": "Password123",
      };

      for (const validator of validators) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).toBe(true);
    });

    it("should fail validation when password is empty", async () => {
      req.body = {
        password: "",
        "confirm-password": "Password123",
      };

      for (const validator of validators) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).toBe(false);
      expect((req as any).t).toHaveBeenCalledWith(
        "pages.changePassword.password.validationError.required",
        expect.anything()
      );
    });

    it("should fail validation when password exceeds 256 characters", async () => {
      const longPassword = "a".repeat(257);
      req.body = {
        password: longPassword,
        "confirm-password": longPassword,
      };

      for (const validator of validators) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).toBe(false);
      expect((req as any).t).toHaveBeenCalledWith(
        "pages.changePassword.password.validationError.maxLength",
        expect.anything()
      );
    });

    it("should fail validation when password has no numbers", async () => {
      req.body = {
        password: "Password",
        "confirm-password": "Password",
      };

      for (const validator of validators) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).toBe(false);
      expect((req as any).t).toHaveBeenCalledWith(
        "pages.changePassword.password.validationError.alphaNumeric"
      );
    });

    it("should fail validation when password contains only numbers", async () => {
      req.body = {
        password: "12345678",
        "confirm-password": "12345678",
      };

      for (const validator of validators) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).toBe(false);
      expect((req as any).t).toHaveBeenCalledWith(
        "pages.changePassword.password.validationError.alphaNumeric"
      );
    });

    it("should fail validation when password is less than 8 characters", async () => {
      req.body = {
        password: "Pass1",
        "confirm-password": "Pass1",
      };

      for (const validator of validators) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).toBe(false);
      expect((req as any).t).toHaveBeenCalledWith(
        "pages.changePassword.password.validationError.alphaNumeric"
      );
    });

    it("should fail validation when passwords do not match", async () => {
      req.body = {
        password: "Password123",
        "confirm-password": "DifferentPassword123",
      };

      for (const validator of validators) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).toBe(false);
      expect((req as any).t).toHaveBeenCalledWith(
        "pages.changePassword.confirmPassword.validationError.matches"
      );
    });

    it("should fail validation when confirm-password is empty", async () => {
      req.body = {
        password: "Password123",
        "confirm-password": "",
      };

      for (const validator of validators) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).toBe(false);
      expect((req as any).t).toHaveBeenCalledWith(
        "pages.changePassword.confirmPassword.validationError.required",
        expect.anything()
      );
    });
  });
});
