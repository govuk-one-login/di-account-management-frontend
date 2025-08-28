import { PATH_DATA } from "../../app.constants";
import * as express from "express";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import {
  globalLogoutConfirmGet,
  globalLogoutGet,
  globalLogoutPost,
} from "./global-logout-controller";

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
  globalLogoutConfirmGet
);

export { router as globalLogoutRouter };
