import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import {
  addMfaMethodGet,
  addMfaMethodPost,
} from "./add-mfa-methods-controller";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { selectMfaMiddleware } from "../../middleware/mfa-method-middleware";
import { validateAddMfaMethodRequest } from "./add-mfa-mehod-validation";

const router = express.Router();

router.get(
  PATH_DATA.ADD_MFA_METHOD.url,
  requiresAuthMiddleware,
  selectMfaMiddleware(),
  validateStateMiddleware,
  addMfaMethodGet
);

router.post(
  PATH_DATA.ADD_MFA_METHOD.url,
  requiresAuthMiddleware,
  ...validateAddMfaMethodRequest(),
  addMfaMethodPost
);

export { router as addMfaMethodRouter };
