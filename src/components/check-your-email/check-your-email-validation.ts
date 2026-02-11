import { validateBodyMiddleware } from "../../middleware/form-validation-middleware.js";
import { ValidationChainFunc } from "../../types.js";
import { body } from "express-validator";
import { containsNumbersOnly } from "../../utils/strings.js";

export function validateCheckYourEmailRequest(): ValidationChainFunc {
  return [
    body("code")
      .notEmpty()
      .withMessage((value, { req }) => {
        return req.t("pages.checkYourEmail.code.validationError.required", {
          value,
        });
      })
      .isLength({ max: 6 })
      .withMessage((value, { req }) => {
        return req.t("pages.checkYourEmail.code.validationError.maxLength", {
          value,
        });
      })
      .isLength({ min: 6 })
      .withMessage((value, { req }) => {
        return req.t("pages.checkYourEmail.code.validationError.minLength", {
          value,
        });
      })
      .custom((value, { req }) => {
        if (!containsNumbersOnly(value)) {
          throw new Error(
            req.t("pages.checkYourEmail.code.validationError.invalidFormat")
          );
        }
        return true;
      }),
    validateBodyMiddleware("check-your-email/index.njk"),
  ];
}
