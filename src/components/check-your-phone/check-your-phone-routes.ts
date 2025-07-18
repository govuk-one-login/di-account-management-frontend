import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import {
  checkYourPhoneGet,
  checkYourPhonePost,
  requestNewOTPCodeGet,
} from "./check-your-phone-controller";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware";
import {
  globalTryCatchAsync,
  globalTryCatch,
} from "../../utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.CHECK_YOUR_PHONE.url,
  requiresAuthMiddleware,
  mfaMethodMiddleware,
  validateStateMiddleware,
  globalTryCatch(checkYourPhoneGet)
);

router.post(
  PATH_DATA.CHECK_YOUR_PHONE.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  globalTryCatchAsync(checkYourPhonePost)
);

router.get(
  PATH_DATA.REQUEST_NEW_CODE_OTP.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  globalTryCatch(requestNewOTPCodeGet)
);

export { router as checkYourPhoneRouter };
