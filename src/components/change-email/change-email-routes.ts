import { PATH_DATA } from "../../app.constants";
import { changeEmailPost, changeEmailGet } from "./change-email-controller";
import * as express from "express";
import { asyncHandler } from "../../utils/async";
import { validateChangeEmailRequest } from "./change-email-validation";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware";
import { globalTryCatchAsync } from "../../utils/global-try-catch";

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
  validateStateMiddleware,
  validateChangeEmailRequest(),
  refreshTokenMiddleware(),
  globalTryCatchAsync(asyncHandler(changeEmailPost()))
);

export { router as changeEmailRouter };
