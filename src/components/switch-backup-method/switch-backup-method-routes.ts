import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import {
  switchBackupMfaMethodGet,
  switchBackupMfaMethodPost,
} from "./switch-backup-method-controller";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { globalTryCatchAsync } from "../../utils/global-try-catch";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware";

const router = express.Router();

router.get(
  PATH_DATA.SWITCH_BACKUP_METHOD.url,
  requiresAuthMiddleware,
  mfaMethodMiddleware,
  validateStateMiddleware,
  globalTryCatchAsync(switchBackupMfaMethodGet)
);

router.post(
  PATH_DATA.SWITCH_BACKUP_METHOD.url,
  requiresAuthMiddleware,
  mfaMethodMiddleware,
  validateStateMiddleware,
  refreshTokenMiddleware(),
  globalTryCatchAsync(switchBackupMfaMethodPost)
);

export { router as switchBackupMethodRouter };
