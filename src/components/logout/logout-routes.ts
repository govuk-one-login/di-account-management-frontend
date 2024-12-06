import * as express from "express";
import { logoutPost } from "./logout-controller";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { globalTryCatchAsync } from "../../utils/global-try-catch";

const router = express.Router();

router.post(
  PATH_DATA.SIGN_OUT.url,
  requiresAuthMiddleware,
  globalTryCatchAsync(logoutPost)
);

export { router as logoutRouter };
