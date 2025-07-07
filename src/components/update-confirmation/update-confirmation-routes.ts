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
  changeDefaultMethodConfirmationGet,
} from "./update-confirmation-controller";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware";
import {
  globalTryCatchAsync,
  globalTryCatch,
} from "../../utils/global-try-catch";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware";

const router = express.Router();

router.get(
  PATH_DATA.EMAIL_UPDATED_CONFIRMATION.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  globalTryCatch(updateEmailConfirmationGet)
);
router.get(
  PATH_DATA.PASSWORD_UPDATED_CONFIRMATION.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  globalTryCatch(updatePasswordConfirmationGet)
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
  globalTryCatchAsync(removeMfaMethodConfirmationGet)
);

router.get(
  PATH_DATA.SWITCH_BACKUP_METHOD_CONFIRMATION.url,
  requiresAuthMiddleware,
  refreshTokenMiddleware(),
  mfaMethodMiddleware,
  validateStateMiddleware,
  globalTryCatchAsync(changeDefaultMfaMethodConfirmationGet)
);

router.get(
  PATH_DATA.CHANGE_DEFAULT_METHOD_CONFIRMATION.url,
  requiresAuthMiddleware,
  refreshTokenMiddleware(),
  mfaMethodMiddleware,
  validateStateMiddleware,
  globalTryCatchAsync(changeDefaultMethodConfirmationGet)
);

export { router as updateConfirmationRouter };
