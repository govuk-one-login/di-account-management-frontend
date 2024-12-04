import * as express from "express";
import { PATH_DATA } from "../../app.constants";

import {
  resendEmailCodeGet,
  resendEmailCodePost,
} from "./resend-email-code-controller";
import { asyncHandler } from "../../utils/async";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { globalTryCatch } from "../../utils/global-try-catch";

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
  globalTryCatch(asyncHandler(resendEmailCodePost()))
);

export { router as resendEmailCodeRouter };
