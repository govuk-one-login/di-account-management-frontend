import { expect } from "chai";
import { describe } from "mocha";
import { Request } from "express";
import { validationResult } from "express-validator";
import { sinon } from "../../../../test/utils/test-utils";
import { RequestBuilder } from "../../../../test/utils/builders";
import { validateChangePasswordRequest } from "../change-password-validation";

describe("change password validation", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = new RequestBuilder()
      .withTranslate(sandbox.fake.returns("validation error"))
      .build();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("validateChangePasswordRequest", () => {
    it("should pass validation with valid password and matching confirmation", async () => {
      req.body = {
        password: "Password123",
        "confirm-password": "Password123",
      };

      const validators = validateChangePasswordRequest();
      for (const validator of validators.slice(0, -1)) {
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

      const validators = validateChangePasswordRequest();
      for (const validator of validators.slice(0, -1)) {
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

      const validators = validateChangePasswordRequest();
      for (const validator of validators.slice(0, -1)) {
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

      const validators = validateChangePasswordRequest();
      for (const validator of validators.slice(0, -1)) {
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

      const validators = validateChangePasswordRequest();
      for (const validator of validators.slice(0, -1)) {
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

      const validators = validateChangePasswordRequest();
      for (const validator of validators.slice(0, -1)) {
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

      const validators = validateChangePasswordRequest();
      for (const validator of validators.slice(0, -1)) {
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

      const validators = validateChangePasswordRequest();
      for (const validator of validators.slice(0, -1)) {
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
