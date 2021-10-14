import * as express from "express";
import { logoutGet } from "./logout-controller";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";

const router = express.Router();

router.get(PATH_DATA.SIGN_OUT.url, requiresAuthMiddleware, logoutGet);

export { router as logoutRouter };
