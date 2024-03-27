import * as express from "express";
import { securityGet } from "./security-controller";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { legacyMfaMethodsMiddleware } from "../../middleware/mfa-methods-legacy";
import { mfaMethodMiddleware } from "src/middleware/mfa-method-middleware";

const router = express.Router();

router.get(
  PATH_DATA.SECURITY.url,
  requiresAuthMiddleware,
  legacyMfaMethodsMiddleware,
  mfaMethodMiddleware,
  securityGet
);

export { router as securityRouter };
