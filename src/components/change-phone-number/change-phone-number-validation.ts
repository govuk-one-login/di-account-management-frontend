import { body } from "express-validator";
import { validateBodyMiddleware } from "../../middleware/form-validation-middleware";
import { ValidationChainFunc } from "../../types";
import {
  containsInternationalMobileNumber,
  containsLeadingPlusNumbersOrSpacesOnly,
  containsNumbersOrSpacesOnly,
  containsUKMobileNumber,
  lengthInRangeWithoutSpaces,
} from "../../utils/phone-number";

export function validateChangePhoneNumberRequest(): ValidationChainFunc {
  return [
    body("phoneNumber")
      .if(body("hasInternationalPhoneNumber").not().equals("true"))
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
    body("internationalPhoneNumber")
        .if(body("hasInternationalPhoneNumber").notEmpty().equals("true"))
        .notEmpty()
        .withMessage((value, { req }) => {
          return req.t(
              "pages.changePhoneNumber.internationalPhoneNumber.validationError.required",
              { value }
          );
        })
        .custom((value, { req }) => {
          if (!containsLeadingPlusNumbersOrSpacesOnly(value)) {
            throw new Error(
                req.t(
                    "pages.changePhoneNumber.internationalPhoneNumber.validationError.plusNumericOnly"
                )
            );
          }
          return true;
        })
        .custom((value, { req }) => {
          if (!lengthInRangeWithoutSpaces(value, 5, 16)) {
            throw new Error(
                req.t(
                    "pages.changePhoneNumber.internationalPhoneNumber.validationError.internationalFormat"
                )
            );
          }
          return true;
        })
        .custom((value, { req }) => {
          if (!containsInternationalMobileNumber(value)) {
            throw new Error(
                req.t(
                    "pages.changePhoneNumber.internationalPhoneNumber.validationError.internationalFormat"
                )
            );
          }
          return true;
        }),
    validateBodyMiddleware("change-phone-number/index.njk"),
  ];
}
