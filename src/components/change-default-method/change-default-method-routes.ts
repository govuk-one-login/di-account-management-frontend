import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";
import {
  changeDefaultMethodAppGet,
  changeDefaultMethodAppPost,
  changeDefaultMethodGet,
  changeDefaultMethodSmsGet,
  changeDefaultMethodSmsPost,
} from "./change-default-method-controllers.js";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware.js";
import { validatePhoneNumberRequest } from "../change-phone-number/change-phone-number-validation.js";
import { changePhoneNumberService } from "../change-phone-number/change-phone-number-service.js";

const router = express.Router();

router.get(
  PATH_DATA.CHANGE_DEFAULT_METHOD.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  mfaMethodMiddleware,
  changeDefaultMethodGet
);

router.get(
  PATH_DATA.CHANGE_DEFAULT_METHOD_APP.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  mfaMethodMiddleware,
  changeDefaultMethodAppGet
);

router.post(
  PATH_DATA.CHANGE_DEFAULT_METHOD_APP.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  mfaMethodMiddleware,
  changeDefaultMethodAppPost
);

router.get(
  PATH_DATA.CHANGE_DEFAULT_METHOD_SMS.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  mfaMethodMiddleware,
  changeDefaultMethodSmsGet
);

router.post(
  PATH_DATA.CHANGE_DEFAULT_METHOD_SMS.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  validatePhoneNumberRequest(),
  mfaMethodMiddleware,
  changeDefaultMethodSmsPost(changePhoneNumberService())
);

export { router as changeDefaultMethodRouter };
