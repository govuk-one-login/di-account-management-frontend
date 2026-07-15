import * as express from "express";
import { signInDetailsGet } from "./sign-in-details-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware.js";
import { blockPasskeyRoutesIfNotEnabled } from "../../middleware/block-passkeys-routes-if-not-enabled.js";

const router = express.Router();

router.get(
  PATH_DATA.SIGN_IN_DETAILS.url,
  blockPasskeyRoutesIfNotEnabled,
  requiresAuthMiddleware,
  mfaMethodMiddleware,
  signInDetailsGet
);

export { router as signInDetailsRouter };
