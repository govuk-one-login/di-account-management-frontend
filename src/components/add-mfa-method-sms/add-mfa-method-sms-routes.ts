import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import {
  addMfaSmsMethodConfirmationGet,
  addMfaSmsMethodGet,
  addMfaSmsMethodPost,
} from "./add-mfa-method-sms-controller";
import { validatePhoneNumberRequest } from "../change-phone-number/change-phone-number-validation";
import { globalTryCatchAsync } from "../../utils/global-try-catch";

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
  validatePhoneNumberRequest(),
  validateStateMiddleware,
  globalTryCatchAsync(addMfaSmsMethodPost())
);

router.get(
  PATH_DATA.ADD_MFA_METHOD_SMS_CONFIRMATION.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  globalTryCatchAsync(addMfaSmsMethodConfirmationGet)
);

export { router as addBackupSmsRouter };
