import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import {
  addMfaAppMethodConfirmationGet,
  addMfaSmsMethodGet,
  addMfaSmsMethodPost,
} from "./add-mfa-method-sms-controller";
import { asyncHandler } from "../../utils/async";
import { validatePhoneNumberRequest } from "../change-phone-number/change-phone-number-validation";

const router = express.Router();

router.get(
  PATH_DATA.ADD_MFA_METHOD_SMS.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  addMfaSmsMethodGet
);

router.post(
  PATH_DATA.ADD_MFA_METHOD_SMS.url,
  requiresAuthMiddleware,
  validatePhoneNumberRequest("add-mfa-method-sms/index.njk"),
  validateStateMiddleware,
  asyncHandler(addMfaSmsMethodPost())
);

router.get(
  PATH_DATA.ADD_MFA_METHOD_SMS_CONFIRMATION.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  addMfaAppMethodConfirmationGet
);

export { router as addMfaMethodSmsRouter };
