import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";

import {
  resendEmailCodeGet,
  resendEmailCodePost,
} from "./resend-email-code-controller.js";
import { asyncHandler } from "../../utils/async.js";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";

const router = express.Router();

router.get(
  PATH_DATA.RESEND_EMAIL_CODE.url,
  requiresAuthMiddleware,
  resendEmailCodeGet
);

router.post(
  PATH_DATA.RESEND_EMAIL_CODE.url,
  requiresAuthMiddleware,
  refreshTokenMiddleware(),
  asyncHandler(resendEmailCodePost())
);

export { router as resendEmailCodeRouter };
