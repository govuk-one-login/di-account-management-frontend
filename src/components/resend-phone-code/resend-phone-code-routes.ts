import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";

import {
  resendPhoneCodeGet,
  resendPhoneCodePost,
} from "./resend-phone-code-controller.js";
import { asyncHandler } from "../../utils/async.js";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { validateChangePhoneNumberRequest } from "../change-phone-number/change-phone-number-validation.js";

const router = express.Router();

router.get(
  PATH_DATA.RESEND_PHONE_CODE.url,
  requiresAuthMiddleware,
  resendPhoneCodeGet
);

router.post(
  PATH_DATA.RESEND_PHONE_CODE.url,
  requiresAuthMiddleware,
  validateChangePhoneNumberRequest(),
  refreshTokenMiddleware(),
  asyncHandler(resendPhoneCodePost())
);

export { router as resendPhoneCodeRouter };
