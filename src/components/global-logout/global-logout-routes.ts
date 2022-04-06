import * as express from "express";
import { globalLogoutPost } from "./global-logout-controller";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";

const router = express.Router();

router.post(PATH_DATA.GLOBAL_LOGOUT.url, requiresAuthMiddleware, globalLogoutPost);

export { router as globalLogoutRouter };
