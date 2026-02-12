import { PATH_DATA } from "../../app.constants.js";

import * as express from "express";
import {
  deleteAccountGet,
  deleteAccountPost,
} from "./delete-account-controller.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";

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
