import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request } from "express";
import { validationResult } from "express-validator";
import { RequestBuilder } from "../../../../test/utils/builders";
import { validateCheckYourEmailRequest } from "../check-your-email-validation.js";
import { ValidationChainFunc } from "../../../types";
import * as formValidationMiddleware from "../../../middleware/form-validation-middleware.js";

describe("check your email validation", () => {
  let req: Partial<Request>;
  let validators: ValidationChainFunc;

  beforeEach(() => {
    req = new RequestBuilder()
      .withTranslate(vi.fn().mockReturnValue("validation error"))
      .build();

    const stub = vi.spyOn(formValidationMiddleware, "validateBodyMiddleware");
    stub.mockReturnValue(() => {});
    validators = validateCheckYourEmailRequest();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validateCheckYourEmailRequest", () => {
    it("should pass validation with valid 6-digit code", async () => {
      req.body = { code: "123456" };

      for (const validator of validators) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).toBe(true);
    });

    it("should fail validation when code is empty", async () => {
      req.body = { code: "" };

      for (const validator of validators) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).toBe(false);
      expect((req as any).t).toHaveBeenCalledWith(
        "pages.checkYourEmail.code.validationError.required",
        expect.anything()
      );
    });

    it("should fail validation when code exceeds 6 characters", async () => {
      req.body = { code: "1234567" };

      for (const validator of validators) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).toBe(false);
      expect((req as any).t).toHaveBeenCalledWith(
        "pages.checkYourEmail.code.validationError.maxLength",
        expect.anything()
      );
    });

    it("should fail validation when code is less than 6 characters", async () => {
      req.body = { code: "12345" };

      for (const validator of validators) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).toBe(false);
      expect((req as any).t).toHaveBeenCalledWith(
        "pages.checkYourEmail.code.validationError.minLength",
        expect.anything()
      );
    });

    it("should fail validation when code contains non-numeric characters", async () => {
      req.body = { code: "12345a" };

      for (const validator of validators) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).toBe(false);
      expect((req as any).t).toHaveBeenCalledWith(
        "pages.checkYourEmail.code.validationError.invalidFormat"
      );
    });
  });
});
