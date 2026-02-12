import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import {
  switchBackupMfaMethodGet,
  switchBackupMfaMethodPost,
} from "./switch-backup-method-controller.js";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";

const router = express.Router();

router.get(
  PATH_DATA.SWITCH_BACKUP_METHOD.url,
  requiresAuthMiddleware,
  mfaMethodMiddleware,
  validateStateMiddleware,
  switchBackupMfaMethodGet
);

router.post(
  PATH_DATA.SWITCH_BACKUP_METHOD.url,
  requiresAuthMiddleware,
  mfaMethodMiddleware,
  validateStateMiddleware,
  switchBackupMfaMethodPost
);

export { router as switchBackupMethodRouter };
