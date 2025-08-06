import { PATH_DATA } from "../../app.constants";

import * as express from "express";
import {
  deleteAccountGet,
  deleteAccountPost,
} from "./delete-account-controller";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";

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
  validateStateMiddleware,
  deleteAccountPost()
);

export { router as deleteAccountRouter };
