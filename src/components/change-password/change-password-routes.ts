import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import {
  changePasswordGet,
  changePasswordPost,
} from "./change-password-controller";
import { validateChangePasswordRequest } from "./change-password-validation";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";

const router = express.Router();

router.get(
  PATH_DATA.CHANGE_PASSWORD.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  changePasswordGet
);

router.post(
  PATH_DATA.CHANGE_PASSWORD.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  validateChangePasswordRequest(),
  changePasswordPost()
);

export { router as changePasswordRouter };
