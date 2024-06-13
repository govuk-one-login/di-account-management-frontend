import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";
import {
  enterPasswordPost,
  enterPasswordGet,
} from "./enter-password-controller.js";
import { asyncHandler } from "../../utils/async.js";
import { validateEnterPasswordRequest } from "./enter-password-validation.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware.js";

const router = express.Router();

router.get(
  PATH_DATA.ENTER_PASSWORD.url,
  requiresAuthMiddleware,
  enterPasswordGet
);

router.post(
  PATH_DATA.ENTER_PASSWORD.url,
  requiresAuthMiddleware,
  validateEnterPasswordRequest(),
  refreshTokenMiddleware(),
  asyncHandler(enterPasswordPost())
);

export { router as enterPasswordRouter };
