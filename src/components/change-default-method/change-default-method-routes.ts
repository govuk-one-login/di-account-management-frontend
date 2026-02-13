import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import {
  changeDefaultMethodAppGet,
  changeDefaultMethodAppPost,
  changeDefaultMethodGet,
  changeDefaultMethodSmsGet,
  changeDefaultMethodSmsPost,
} from "./change-default-method-controllers";
import { mfaMethodMiddleware } from "../../middleware/mfa-method-middleware";
import { validatePhoneNumberRequest } from "../change-phone-number/change-phone-number-validation";
import { changePhoneNumberService } from "../change-phone-number/change-phone-number-service";
import { noUkPhoneNumberGet } from "../no-uk-mobile-phone/no-uk-mobile-phone-controller";

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

router.get(
  PATH_DATA.NO_UK_PHONE_NUMBER.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  noUkPhoneNumberGet
);

export { router as changeDefaultMethodRouter };
