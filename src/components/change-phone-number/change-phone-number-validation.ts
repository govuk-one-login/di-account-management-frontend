import { body } from "express-validator";
import { ValidationChainFunc } from "../../types";
import {
  containsInternationalMobileNumber,
  containsLeadingPlusNumbersOrSpacesOnly,
  containsUKMobileNumber,
  lengthInRangeWithoutSpaces,
  phoneNumberInUse,
} from "../../utils/phone-number";

export function validatePhoneNumberRequest(): ValidationChainFunc {
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
        if (!containsLeadingPlusNumbersOrSpacesOnly(value)) {
          throw new Error(
            req.t(
              "pages.changePhoneNumber.ukPhoneNumber.validationError.plusNumericOnly"
            )
          );
        }
        return true;
      })
      .custom((value, { req }) => {
        if (!lengthInRangeWithoutSpaces(value, 10, 14)) {
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
      })
      .custom((value, { req }) => {
        if (phoneNumberInUse(value, req.session.mfaMethods)) {
          throw new Error(
            req.t(
              "pages.changePhoneNumber.ukPhoneNumber.validationError.samePhoneNumber"
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
        if (!lengthInRangeWithoutSpaces(value, 5, 26)) {
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
      })
      .custom((value, { req }) => {
        if (phoneNumberInUse(value, req.session.mfaMethods)) {
          throw new Error(
            req.t(
              "pages.changePhoneNumber.internationalPhoneNumber.validationError.samePhoneNumber"
            )
          );
        }
        return true;
      }),
  ];
}
