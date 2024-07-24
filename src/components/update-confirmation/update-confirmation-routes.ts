import { PATH_DATA } from "../../app.constants";

import * as express from "express";
import {
  addMfaAppMethodConfirmationGet,
  deleteAccountConfirmationGet,
  updateAuthenticatorAppConfirmationGet,
  updateEmailConfirmationGet,
  updatePasswordConfirmationGet,
  updatePhoneNumberConfirmationGet,
  removeMfaMethodConfirmationGet,
  changeDefaultMfaMethodConfirmationGet,
} from "./update-confirmation-controller";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { selectMfaMiddleware } from "../../middleware/mfa-method-middleware";

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
  PATH_DATA.AUTHENTICATOR_APP_UPDATED_CONFIRMATION.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  updateAuthenticatorAppConfirmationGet
);
router.get(
  PATH_DATA.ACCOUNT_DELETED_CONFIRMATION.url,
  deleteAccountConfirmationGet
);

router.get(
  PATH_DATA.ADD_MFA_METHOD_APP_CONFIRMATION.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  addMfaAppMethodConfirmationGet
);

router.get(
  PATH_DATA.DELETE_MFA_METHOD_CONFIRMATION.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  removeMfaMethodConfirmationGet
);

router.get(
  PATH_DATA.CHANGE_DEFAULT_METHOD_CONFIRMATION.url,
  requiresAuthMiddleware,
  selectMfaMiddleware(),
  validateStateMiddleware,
  changeDefaultMfaMethodConfirmationGet
);

export { router as updateConfirmationRouter };
