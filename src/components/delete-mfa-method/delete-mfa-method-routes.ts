import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { selectMfaMiddleware } from "../../middleware/mfa-method-middleware";
import {
  deleteMfaMethodGet,
  deleteMfaMethodPost,
} from "./delete-mfa-method-controller";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";

const router = express.Router();

router.get(
  PATH_DATA.DELETE_MFA_METHOD.url,
  requiresAuthMiddleware,
  selectMfaMiddleware(),
  validateStateMiddleware,
  deleteMfaMethodGet
);

router.post(
  PATH_DATA.DELETE_MFA_METHOD.url,
  requiresAuthMiddleware,
  selectMfaMiddleware(),
  validateStateMiddleware,
  deleteMfaMethodPost
);

export { router as deleteMfaMethodRouter };
