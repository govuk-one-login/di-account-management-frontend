import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { chooseBackupGet, chooseBackupPost } from "./choose-backup-controller";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { selectMfaMiddleware } from "../../middleware/mfa-method-middleware";
import { validateChooseBackupRequest } from "./choose-backup-validation";

const router = express.Router();

router.get(
  PATH_DATA.ADD_MFA_METHOD.url,
  requiresAuthMiddleware,
  selectMfaMiddleware(),
  validateStateMiddleware,
  chooseBackupGet
);

router.post(
  PATH_DATA.ADD_MFA_METHOD.url,
  requiresAuthMiddleware,
  ...validateChooseBackupRequest(),
  chooseBackupPost
);

export { router as chooseBackupRouter };
