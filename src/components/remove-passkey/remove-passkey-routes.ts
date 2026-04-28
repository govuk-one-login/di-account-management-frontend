import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware.js";
import {
  removePasskeyGet,
  removePasskeyPost,
} from "./remove-passkey-controller.js";

const router = express.Router();

router.get(
  `${PATH_DATA.REMOVE_PASSKEY.url}`,
  requiresAuthMiddleware,
  validateStateMiddleware,
  mfaMethodMiddleware,
  removePasskeyGet
);

router.post(
  `${PATH_DATA.REMOVE_PASSKEY.url}`,
  requiresAuthMiddleware,
  validateStateMiddleware,
  removePasskeyPost
);

export { router as removePasskeyRouter };
