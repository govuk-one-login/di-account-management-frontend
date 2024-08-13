import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import {
  changeDefaultMfaMethodGet,
  changeDefaultMfaMethodPost,
} from "./change-default-method-controller";
import { selectMfaMiddleware } from "../../middleware/mfa-method-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";

const router = express.Router();

router.get(
  PATH_DATA.SWITCH_BACKUP_METHOD.url,
  requiresAuthMiddleware,
  selectMfaMiddleware(),
  validateStateMiddleware,
  changeDefaultMfaMethodGet
);

router.post(
  PATH_DATA.SWITCH_BACKUP_METHOD.url,
  requiresAuthMiddleware,
  selectMfaMiddleware(),
  validateStateMiddleware,
  changeDefaultMfaMethodPost
);

export { router as changeDefaultMethodRouter };
