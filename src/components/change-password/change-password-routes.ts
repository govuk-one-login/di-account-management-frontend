import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";
import {
  changePasswordGet,
  changePasswordPost,
} from "./change-password-controller.js";
import { validateChangePasswordRequest } from "./change-password-validation.js";
import { asyncHandler } from "../../utils/async.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware.js";

const router = express.Router();

router.get(
  PATH_DATA.CHANGE_PASSWORD.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  changePasswordGet
);

router.post(
  PATH_DATA.CHANGE_PASSWORD.url,
  requiresAuthMiddleware,
  validateChangePasswordRequest(),
  refreshTokenMiddleware(),
  asyncHandler(changePasswordPost())
);

export { router as changePasswordRouter };
