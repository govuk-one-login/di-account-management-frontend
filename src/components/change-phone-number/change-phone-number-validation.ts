import { body } from "express-validator";
import { validateBodyMiddleware } from "../../middleware/form-validation-middleware";
import { ValidationChainFunc } from "../../types";
import {
  containsNumbersOrSpacesOnly,
  containsUKMobileNumber,
  lengthInRangeWithoutSpaces,
} from "../../utils/phone-number";

export function validateChangePhoneNumberRequest(): ValidationChainFunc {
  return [
    body("phoneNumber")
      .notEmpty()
      .trim()
      .withMessage((value, { req }) => {
        return req.t(
          "pages.changePhoneNumber.ukPhoneNumber.validationError.required",
          { value }
        );
      })
      .custom((value, { req }) => {
        if (!containsNumbersOrSpacesOnly(value)) {
          throw new Error(
            req.t(
              "pages.changePhoneNumber.ukPhoneNumber.validationError.numeric"
            )
          );
        }
        return true;
      })
      .custom((value, { req }) => {
        if (!lengthInRangeWithoutSpaces(value, 10, 11)) {
          throw new Error(
            req.t(
              "pages.changePhoneNumber.ukPhoneNumber.validationError.length"
            )
          );
        }
        return true;
      })
      .custom((value, { req }) => {
        if (!containsUKMobileNumber(value)) {
          throw new Error(
            req.t(
              "pages.changePhoneNumber.ukPhoneNumber.validationError.international"
            )
          );
        }
        return true;
      }),
    validateBodyMiddleware("change-phone-number/index.njk"),
  ];
}
