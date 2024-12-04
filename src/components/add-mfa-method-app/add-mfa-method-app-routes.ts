import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import {
  addMfaAppMethodGet,
  addMfaAppMethodPost,
} from "./add-mfa-method-app-controller";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { globalTryCatch } from "../../utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.ADD_MFA_METHOD_APP.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  globalTryCatch(addMfaAppMethodGet)
);

router.post(
  PATH_DATA.ADD_MFA_METHOD_APP.url,
  requiresAuthMiddleware,
  globalTryCatch(addMfaAppMethodPost)
);

export { router as addMfaMethodAppRouter };
