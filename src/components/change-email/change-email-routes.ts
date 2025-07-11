import { PATH_DATA } from "../../app.constants";
import { changeEmailPost, changeEmailGet } from "./change-email-controller";
import * as express from "express";
import { validateChangeEmailRequest } from "./change-email-validation";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
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
  globalTryCatchAsync(changeEmailPost())
);

export { router as changeEmailRouter };
