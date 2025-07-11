import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware";
import {
  deleteMfaMethodGet,
  deleteMfaMethodPost,
} from "./delete-mfa-method-controller";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { globalTryCatchAsync } from "../../utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.DELETE_MFA_METHOD.url,
  requiresAuthMiddleware,
  mfaMethodMiddleware,
  validateStateMiddleware,
  globalTryCatchAsync(deleteMfaMethodGet)
);

router.post(
  PATH_DATA.DELETE_MFA_METHOD.url,
  requiresAuthMiddleware,
  mfaMethodMiddleware,
  validateStateMiddleware,
  globalTryCatchAsync(deleteMfaMethodPost)
);

export { router as deleteMfaMethodRouter };
