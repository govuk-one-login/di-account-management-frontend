import * as express from "express";
import { PATH_DATA } from "../../app.constants";

import {
  resendPhoneCodeGet,
  resendPhoneCodePost,
} from "./resend-phone-code-controller";
import { asyncHandler } from "../../utils/async";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validatePhoneNumberRequest } from "../change-phone-number/change-phone-number-validation";
import { globalTryCatchAsync } from "../../utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.RESEND_PHONE_CODE.url,
  requiresAuthMiddleware,
  resendPhoneCodeGet
);

router.post(
  PATH_DATA.RESEND_PHONE_CODE.url,
  requiresAuthMiddleware,
  validatePhoneNumberRequest("change-phone-number/index.njk"),
  refreshTokenMiddleware(),
  globalTryCatchAsync(asyncHandler(resendPhoneCodePost()))
);

export { router as resendPhoneCodeRouter };
