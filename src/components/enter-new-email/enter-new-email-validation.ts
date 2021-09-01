import { body } from "express-validator";
import { validateBodyMiddleware } from "../../middleware/form-validation-middleware";
import { ValidationChainFunc } from "../../types";

export function validateEnterNewEmailRequest(
  template = "enter-new-email/index.njk"
): ValidationChainFunc {
  return [
    body("email")
      .notEmpty()
      .withMessage((value, { req }) => {
        return req.t("pages.enterNewEmail.email.validationError.required", {
          value,
        });
      })
      .isLength({ max: 256 })
      .withMessage((value, { req }) => {
        return req.t("pages.enterNewEmail.email.validationError.length", {
          value,
        });
      })
      .isEmail()
      .withMessage((value, { req }) => {
        return req.t("pages.enterNewEmail.email.validationError.email", {
          value,
        });
      }),
    validateBodyMiddleware(template),
  ];
}
