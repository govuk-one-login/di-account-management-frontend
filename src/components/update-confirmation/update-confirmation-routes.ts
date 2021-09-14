import { PATH_DATA } from "../../app.constants";

import * as express from "express";
import {
  deleteAccountConfirmationGet,
  updateEmailConfirmationGet,
  updatePasswordConfirmationGet,
  updatePhoneNumberConfirmationGet,
} from "./update-confirmation-controller";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";

const router = express.Router();

router.get(
  PATH_DATA.EMAIL_UPDATED_CONFIRMATION.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  updateEmailConfirmationGet
);
router.get(
  PATH_DATA.PASSWORD_UPDATED_CONFIRMATION.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  updatePasswordConfirmationGet
);
router.get(
  PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  updatePhoneNumberConfirmationGet
);
router.get(
  PATH_DATA.ACCOUNT_DELETED_CONFIRMATION.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  deleteAccountConfirmationGet
);

export { router as updateConfirmationRouter };
