import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import {
  addMfaAppMethodGet,
  addMfaAppMethodPost,
  addMfaMethodGoBackGet,
} from "./add-mfa-method-app-controller";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { globalTryCatchAsync } from "../../utils/global-try-catch";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware";

const router = express.Router();

router.get(
  PATH_DATA.ADD_MFA_METHOD_APP.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  globalTryCatchAsync(addMfaAppMethodGet)
);

router.get(
  PATH_DATA.ADD_MFA_METHOD_GO_BACK.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  globalTryCatchAsync(addMfaMethodGoBackGet)
);

router.post(
  PATH_DATA.ADD_MFA_METHOD_APP.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  mfaMethodMiddleware,
  globalTryCatchAsync(addMfaAppMethodPost)
);

export { router as addBackupAppRouter };
