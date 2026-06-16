import * as express from "express";
import { createNewPasskeyGet } from "./create-new-passkey-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";
import { blockPasskeyRoutesIfNotEnabled } from "../../middleware/block-passkeys-routes-if-not-enabled.js";

const router = express.Router();

router.get(
  PATH_DATA.CREATE_NEW_PASSKEY.url,
  blockPasskeyRoutesIfNotEnabled,
  requiresAuthMiddleware,
  validateStateMiddleware,
  createNewPasskeyGet
);

export { router as createNewPasskeyRouter };
