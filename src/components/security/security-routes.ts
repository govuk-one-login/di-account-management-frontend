import * as express from "express";
import { securityGet } from "./security-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { blockPasskeyRoutesIfNotEnabled } from "../../middleware/block-passkeys-routes-if-not-enabled.js";

const router = express.Router();

router.get(PATH_DATA.SECURITY.url, [
  requiresAuthMiddleware,
  blockPasskeyRoutesIfNotEnabled,
  securityGet,
]);

export { router as securityRouter };
