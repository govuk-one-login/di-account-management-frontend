import * as express from "express";
import { securityGet } from "./security-controller";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware";
import { globalTryCatch } from "../../utils/global-try-catch";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware";

const router = express.Router();

router.get(
  PATH_DATA.SECURITY.url,
  requiresAuthMiddleware,
  refreshTokenMiddleware(),
  mfaMethodMiddleware,
  globalTryCatch(securityGet)
);

export { router as securityRouter };
