import * as express from "express";
import { securityGet } from "./security-controller";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { mfaMethodsMiddleware } from "../../middleware/mfa-methods";

const router = express.Router();

router.get(
  PATH_DATA.SECURITY.url,
  requiresAuthMiddleware,
  mfaMethodsMiddleware,
  securityGet
);

export { router as securityRouter };
