import { PATH_DATA } from "../../app.constants";

import * as express from "express";
import {
  deleteAccountGet,
  deleteAccountPost,
} from "./delete-account-controller";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { globalTryCatchAsync } from "../../utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.DELETE_ACCOUNT.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  globalTryCatchAsync(deleteAccountGet)
);

router.post(
  PATH_DATA.DELETE_ACCOUNT.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  globalTryCatchAsync(deleteAccountPost())
);

export { router as deleteAccountRouter };
