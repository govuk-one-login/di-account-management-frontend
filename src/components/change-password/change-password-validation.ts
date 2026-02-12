import { body } from "express-validator";
import { containsNumber, containsNumbersOnly } from "../../utils/strings.js";
import { validateBodyMiddleware } from "../../middleware/form-validation-middleware.js";
import { ValidationChainFunc } from "../../types.js";

export function validateChangePasswordRequest(): ValidationChainFunc {
  return [
    body("password")
      .notEmpty()
      .withMessage((value, { req }) => {
        return req.t("pages.changePassword.password.validationError.required", {
          value,
        });
      })
      .isLength({ max: 256 })
      .withMessage((value, { req }) => {
        return req.t(
          "pages.changePassword.password.validationError.maxLength",
          {
            value,
          }
        );
      })
      .custom((value, { req }) => {
        if (
          !containsNumber(value) ||
          containsNumbersOnly(value) ||
          value.length < 8
        ) {
          throw new Error(
            req.t("pages.changePassword.password.validationError.alphaNumeric")
          );
        }
        return true;
      })
      .custom((value, { req }) => {
        if (value !== req.body["confirm-password"]) {
          throw new Error(
            req.t(
              "pages.changePassword.confirmPassword.validationError.matches"
            )
          );
        }
        return true;
      }),
    body("confirm-password")
      .notEmpty()
      .withMessage((value, { req }) => {
        return req.t(
          "pages.changePassword.confirmPassword.validationError.required",
          { value }
        );
      })
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error(
            req.t(
              "pages.changePassword.confirmPassword.validationError.matches"
            )
          );
        }
        return true;
      }),
    validateBodyMiddleware("change-password/index.njk"),
  ];
}
