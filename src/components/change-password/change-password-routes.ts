import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import {
  changePasswordGet,
  changePasswordPost,
} from "./change-password-controller";
import { validateChangePasswordRequest } from "./change-password-validation";
import { asyncHandler } from "../../utils/async";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware";
import {
  globalTryCatchAsync,
  globalTryCatch,
} from "../../utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.CHANGE_PASSWORD.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  globalTryCatch(changePasswordGet)
);

router.post(
  PATH_DATA.CHANGE_PASSWORD.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  validateChangePasswordRequest(),
  refreshTokenMiddleware(),
  globalTryCatchAsync(asyncHandler(changePasswordPost()))
);

export { router as changePasswordRouter };
