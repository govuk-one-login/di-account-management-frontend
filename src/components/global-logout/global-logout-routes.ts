import { PATH_DATA } from "../../app.constants.js";
import * as express from "express";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";
import {
  globalLogoutConfirmGet,
  globalLogoutGet,
  globalLogoutPost,
} from "./global-logout-controller.js";

const router = express.Router();

router.get(
  PATH_DATA.GLOBAL_LOGOUT.url,
  requiresAuthMiddleware,
  globalLogoutGet
);

router.post(
  PATH_DATA.GLOBAL_LOGOUT.url,
  requiresAuthMiddleware,
  globalLogoutPost
);

router.get(
  PATH_DATA.GLOBAL_LOGOUT_CONFIRM.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  globalLogoutConfirmGet
);

export { router as globalLogoutRouter };
