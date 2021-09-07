import { body } from "express-validator";
import { validateBodyMiddleware } from "../../middleware/form-validation-middleware";
import { ValidationChainFunc } from "../../types";

export function validateChangeEmailRequest(): ValidationChainFunc {
  return [
    body("email")
      .notEmpty()
      .trim()
      .withMessage((value, { req }) => {
        return req.t("pages.changeEmail.email.validationError.required", {
          value,
        });
      })
      .isLength({ max: 256 })
      .withMessage((value, { req }) => {
        return req.t("pages.changeEmail.email.validationError.length", {
          value,
        });
      })
      .isEmail()
      .normalizeEmail()
      .withMessage((value, { req }) => {
        return req.t("pages.changeEmail.email.validationError.email", {
          value,
        });
      }),
    validateBodyMiddleware("change-email/index.njk"),
  ];
}
