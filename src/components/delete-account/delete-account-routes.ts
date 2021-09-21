import { PATH_DATA } from "../../app.constants";

import * as express from "express";
import {
  deleteAccountGet,
  deleteAccountPost,
} from "./delete-account-controller";
import { asyncHandler } from "../../utils/async";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware";

const router = express.Router();

router.get(
  PATH_DATA.DELETE_ACCOUNT.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  deleteAccountGet
);

router.post(
  PATH_DATA.DELETE_ACCOUNT.url,
  requiresAuthMiddleware,
  refreshTokenMiddleware(),
  asyncHandler(deleteAccountPost())
);

export { router as deleteAccountRouter };
