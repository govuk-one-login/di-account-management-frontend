import * as express from "express";
import { removePasskeyGet, removePasskeyPost } from "./remove-passkey-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";

const router = express.Router();

router.get(
  PATH_DATA.REMOVE_PASSKEY.url,
  requiresAuthMiddleware,
  mfaMethodMiddleware,
  validateStateMiddleware,
  removePasskeyGet
);

router.post(
  PATH_DATA.REMOVE_PASSKEY.url,
  requiresAuthMiddleware,
  removePasskeyPost
);

export { router as removePasskeyRouter };
