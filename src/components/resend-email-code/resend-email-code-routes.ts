import * as express from "express";
import { PATH_DATA } from "../../app.constants";

import {
  resendEmailCodeGet,
  resendEmailCodePost,
} from "./resend-email-code-controller";
import { asyncHandler } from "../../utils/async";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { globalTryCatchAsync } from "../../utils/global-try-catch";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { selectMfaMiddleware } from "../../middleware/mfa-method-middleware";

const router = express.Router();

router.get(
  PATH_DATA.RESEND_EMAIL_CODE.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  selectMfaMiddleware(),
  resendEmailCodeGet
);

router.post(
  PATH_DATA.RESEND_EMAIL_CODE.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  refreshTokenMiddleware(),
  selectMfaMiddleware(),
  globalTryCatchAsync(asyncHandler(resendEmailCodePost()))
);

export { router as resendEmailCodeRouter };
