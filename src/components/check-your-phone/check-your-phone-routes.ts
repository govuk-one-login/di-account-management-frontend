import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { asyncHandler } from "../../utils/async";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import {
  checkYourPhoneGet,
  checkYourPhonePost,
  requestNewOTPCodeGet,
} from "./check-your-phone-controller";
import { validateCheckYourPhoneRequest } from "./check-your-phone-validation";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware";
import { selectMfaMiddleware } from "../../middleware/mfa-method-middleware";
import {
  globalTryCatchAsync,
  globalTryCatch,
} from "../../utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.CHECK_YOUR_PHONE.url,
  requiresAuthMiddleware,
  selectMfaMiddleware(),
  validateStateMiddleware,
  globalTryCatch(checkYourPhoneGet)
);

router.post(
  PATH_DATA.CHECK_YOUR_PHONE.url,
  requiresAuthMiddleware,
  validateCheckYourPhoneRequest(),
  refreshTokenMiddleware(),
  globalTryCatchAsync(asyncHandler(checkYourPhonePost()))
);

router.get(
  PATH_DATA.REQUEST_NEW_CODE_OTP.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  globalTryCatch(requestNewOTPCodeGet)
);

export { router as checkYourPhoneRouter };
