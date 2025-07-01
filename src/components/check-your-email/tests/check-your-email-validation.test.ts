import { expect } from "chai";
import { describe } from "mocha";
import { Request } from "express";
import { validationResult } from "express-validator";
import { sinon } from "../../../../test/utils/test-utils";
import { RequestBuilder } from "../../../../test/utils/builders";
import { validateCheckYourEmailRequest } from "../check-your-email-validation";

describe("check your email validation", () => {
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

  describe("validateCheckYourEmailRequest", () => {
    it("should pass validation with valid 6-digit code", async () => {
      req.body = { code: "123456" };

      const validators = validateCheckYourEmailRequest();
      for (const validator of validators.slice(0, -1)) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).to.be.true;
    });

    it("should fail validation when code is empty", async () => {
      req.body = { code: "" };

      const validators = validateCheckYourEmailRequest();
      for (const validator of validators.slice(0, -1)) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).to.be.false;
      expect((req as any).t).to.have.been.calledWith(
        "pages.checkYourEmail.code.validationError.required"
      );
    });

    it("should fail validation when code exceeds 6 characters", async () => {
      req.body = { code: "1234567" };

      const validators = validateCheckYourEmailRequest();
      for (const validator of validators.slice(0, -1)) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).to.be.false;
      expect((req as any).t).to.have.been.calledWith(
        "pages.checkYourEmail.code.validationError.maxLength"
      );
    });

    it("should fail validation when code is less than 6 characters", async () => {
      req.body = { code: "12345" };

      const validators = validateCheckYourEmailRequest();
      for (const validator of validators.slice(0, -1)) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).to.be.false;
      expect((req as any).t).to.have.been.calledWith(
        "pages.checkYourEmail.code.validationError.minLength"
      );
    });

    it("should fail validation when code contains non-numeric characters", async () => {
      req.body = { code: "12345a" };

      const validators = validateCheckYourEmailRequest();
      for (const validator of validators.slice(0, -1)) {
        await validator(req as Request, {} as any, () => {});
      }

      const errors = validationResult(req as Request);
      expect(errors.isEmpty()).to.be.false;
      expect((req as any).t).to.have.been.calledWith(
        "pages.checkYourEmail.code.validationError.invalidFormat"
      );
    });
  });
});
