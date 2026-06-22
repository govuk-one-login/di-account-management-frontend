import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware.js";
import {
  removePasskeyGet,
  removePasskeyPost,
} from "./remove-passkey-controller.js";
import { blockPasskeyRoutesIfNotEnabled } from "../../middleware/block-passkeys-routes-if-not-enabled.js";

const router = express.Router();

router.get(
  `${PATH_DATA.REMOVE_PASSKEY.url}`,
  blockPasskeyRoutesIfNotEnabled,
  requiresAuthMiddleware,
  validateStateMiddleware,
  mfaMethodMiddleware,
  removePasskeyGet
);

router.post(
  `${PATH_DATA.REMOVE_PASSKEY.url}`,
  blockPasskeyRoutesIfNotEnabled,
  requiresAuthMiddleware,
  validateStateMiddleware,
  removePasskeyPost
);

export { router as removePasskeyRouter };
