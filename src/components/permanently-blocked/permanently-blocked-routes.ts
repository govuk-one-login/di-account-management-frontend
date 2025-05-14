import { PATH_DATA } from "../../app.constants";
import * as express from "express";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { permanentlyBlockedGet } from "./permanently-blocked-controller";
import { globalTryCatch } from "src/utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.UNAVAILABLE_PERMANENT.url,
  requiresAuthMiddleware,
  globalTryCatch(permanentlyBlockedGet)
);

export { router as permanentlyBlockedRouter };
