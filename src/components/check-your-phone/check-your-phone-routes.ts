import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";
import { asyncHandler } from "../../utils/async.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";
import {
  checkYourPhoneGet,
  checkYourPhonePost,
  requestNewOTPCodeGet,
} from "./check-your-phone-controller.js";
import { validateCheckYourPhoneRequest } from "./check-your-phone-validation.js";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware.js";
import { selectMfaMiddleware } from "../../middleware/mfa-method-middleware.js";

const router = express.Router();

router.get(
  PATH_DATA.CHECK_YOUR_PHONE.url,
  requiresAuthMiddleware,
  selectMfaMiddleware(),
  validateStateMiddleware,
  checkYourPhoneGet
);

router.post(
  PATH_DATA.CHECK_YOUR_PHONE.url,
  requiresAuthMiddleware,
  validateCheckYourPhoneRequest(),
  refreshTokenMiddleware(),
  asyncHandler(checkYourPhonePost())
);

router.get(
  PATH_DATA.REQUEST_NEW_CODE_OTP.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  requestNewOTPCodeGet
);

export { router as checkYourPhoneRouter };
