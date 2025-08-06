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

const router = express.Router();

router.get(
  PATH_DATA.CHECK_YOUR_PHONE.url,
  requiresAuthMiddleware,
  mfaMethodMiddleware,
  validateStateMiddleware,
  checkYourPhoneGet
);

router.post(
  PATH_DATA.CHECK_YOUR_PHONE.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  mfaMethodMiddleware,
  checkYourPhonePost
);

router.get(
  PATH_DATA.REQUEST_NEW_CODE_OTP.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  requestNewOTPCodeGet
);

export { router as checkYourPhoneRouter };
