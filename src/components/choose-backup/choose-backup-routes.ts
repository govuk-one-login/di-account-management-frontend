import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import {
  chooseBackupGet,
  chooseBackupPost,
} from "./choose-backup-controller.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware.js";
import { validateChooseBackupRequest } from "./choose-backup-validation.js";

const router = express.Router();

router.get(
  PATH_DATA.ADD_MFA_METHOD.url,
  requiresAuthMiddleware,
  mfaMethodMiddleware,
  validateStateMiddleware,
  chooseBackupGet
);

router.post(
  PATH_DATA.ADD_MFA_METHOD.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  ...validateChooseBackupRequest(),
  chooseBackupPost
);

export { router as chooseBackupRouter };
