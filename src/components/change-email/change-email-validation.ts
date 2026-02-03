import { body } from "express-validator";
import { validateBodyMiddleware } from "../../middleware/form-validation-middleware.js";
import { ValidationChainFunc } from "../../types.js";

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
      .withMessage((value, { req }) => {
        return req.t("pages.changeEmail.email.validationError.email", {
          value,
        });
      })
      .bail()
      .normalizeEmail({
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
        outlookdotcom_remove_subaddress: false,
        icloud_remove_subaddress: false,
      }),
    validateBodyMiddleware("change-email/index.njk"),
  ];
}
