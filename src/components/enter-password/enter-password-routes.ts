import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import {
  enterPasswordPost,
  enterPasswordGet,
} from "./enter-password-controller";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import {
  globalTryCatch,
  globalTryCatchAsync,
} from "../../utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.ENTER_PASSWORD.url,
  requiresAuthMiddleware,
  globalTryCatch(enterPasswordGet)
);

router.post(
  PATH_DATA.ENTER_PASSWORD.url,
  requiresAuthMiddleware,
  globalTryCatchAsync(enterPasswordPost())
);

export { router as enterPasswordRouter };
