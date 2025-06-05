import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import {
  enterPasswordPost,
  enterPasswordGet,
} from "./enter-password-controller";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware";
import {
  globalTryCatch,
  globalTryCatchAsync,
} from "../../utils/global-try-catch";
import { asyncHandler } from "../../utils/async";
import { selectMfaMiddleware } from "../../middleware/mfa-method-middleware";

const router = express.Router();

router.get(
  PATH_DATA.ENTER_PASSWORD.url,
  requiresAuthMiddleware,
  selectMfaMiddleware(),
  globalTryCatch(enterPasswordGet)
);

router.post(
  PATH_DATA.ENTER_PASSWORD.url,
  requiresAuthMiddleware,
  refreshTokenMiddleware(),
  selectMfaMiddleware(),
  globalTryCatchAsync(asyncHandler(enterPasswordPost()))
);

export { router as enterPasswordRouter };
