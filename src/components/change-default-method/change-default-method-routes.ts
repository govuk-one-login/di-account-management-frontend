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
import { selectMfaMiddleware } from "../../middleware/mfa-method-middleware";
import { validatePhoneNumberRequest } from "../change-phone-number/change-phone-number-validation";
import { changePhoneNumberService } from "../change-phone-number/change-phone-number-service";
import { globalTryCatch } from "../../utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.CHANGE_DEFAULT_METHOD.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  selectMfaMiddleware(),
  globalTryCatch(changeDefaultMethodGet)
);

router.get(
  PATH_DATA.CHANGE_DEFAULT_METHOD_APP.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  selectMfaMiddleware(),
  globalTryCatch(changeDefaultMethodAppGet)
);

router.post(
  PATH_DATA.CHANGE_DEFAULT_METHOD_APP.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  selectMfaMiddleware(),
  globalTryCatch(changeDefaultMethodAppPost)
);

router.get(
  PATH_DATA.CHANGE_DEFAULT_METHOD_SMS.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  selectMfaMiddleware(),
  globalTryCatch(changeDefaultMethodSmsGet)
);

router.post(
  PATH_DATA.CHANGE_DEFAULT_METHOD_SMS.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  validatePhoneNumberRequest("change-default-method/change-to-sms.njk"),
  selectMfaMiddleware(),
  globalTryCatch(changeDefaultMethodSmsPost(changePhoneNumberService()))
);

export { router as changeDefaultMethodRouter };
