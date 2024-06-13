import { PATH_DATA } from "../../app.constants.js";
import { changeEmailPost, changeEmailGet } from "./change-email-controller.js";
import * as express from "express";
import { asyncHandler } from "../../utils/async.js";
import { validateChangeEmailRequest } from "./change-email-validation.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware.js";

const router = express.Router();

router.get(
  PATH_DATA.CHANGE_EMAIL.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  changeEmailGet
);

router.post(
  PATH_DATA.CHANGE_EMAIL.url,
  requiresAuthMiddleware,
  validateChangeEmailRequest(),
  refreshTokenMiddleware(),
  asyncHandler(changeEmailPost())
);

export { router as changeEmailRouter };
