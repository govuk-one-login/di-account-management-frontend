import * as express from "express";
import { logoutPost } from "./logout-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";

const router = express.Router();

router.post(PATH_DATA.SIGN_OUT.url, requiresAuthMiddleware, logoutPost);

export { router as logoutRouter };
