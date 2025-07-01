import { expect } from "chai";
import { describe } from "mocha";
import { Request } from "express";
import { validationResult } from "express-validator";
import { sinon } from "../../../../test/utils/test-utils";
import { RequestBuilder } from "../../../../test/utils/builders";
import { validateChangePasswordRequest } from "../change-password-validation";
import { ValidationChainFunc } from "../../../types";

describe("change password validation", () => {
  let req: Partial<Request>;
  let validators: ValidationChainFunc;

  beforeEach(() => {
    req = new RequestBuilder()
      .withTranslate(sinon.fake.returns("validation error"))
      .build();

    const validateBodyMiddleware = require("../../../middleware/form-validation-middleware");
    const stub = sinon.stub(validateBodyMiddleware, "validateBodyMiddleware");
    stub.returns(() => {});

    validators = validateChangePasswordRequest();
  });

  afterEach(() => {
    sinon.restore();
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
      expect(errors.isEmpty()).to.be.true;
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
      expect(errors.isEmpty()).to.be.false;
      expect((req as any).t).to.have.been.calledWith(
        "pages.changePassword.password.validationError.required"
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
      expect(errors.isEmpty()).to.be.false;
      expect((req as any).t).to.have.been.calledWith(
        "pages.changePassword.password.validationError.maxLength"
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
      expect(errors.isEmpty()).to.be.false;
      expect((req as any).t).to.have.been.calledWith(
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
      expect(errors.isEmpty()).to.be.false;
      expect((req as any).t).to.have.been.calledWith(
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
      expect(errors.isEmpty()).to.be.false;
      expect((req as any).t).to.have.been.calledWith(
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
      expect(errors.isEmpty()).to.be.false;
      expect((req as any).t).to.have.been.calledWith(
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
      expect(errors.isEmpty()).to.be.false;
      expect((req as any).t).to.have.been.calledWith(
        "pages.changePassword.confirmPassword.validationError.required"
      );
    });
  });
});
