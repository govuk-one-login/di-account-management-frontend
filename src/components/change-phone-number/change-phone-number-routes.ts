import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";
import { validatePhoneNumberRequest } from "./change-phone-number-validation.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import {
  changePhoneNumberGet,
  changePhoneNumberPost,
} from "./change-phone-number-controller.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";

const router = express.Router();

router.get(
  PATH_DATA.CHANGE_PHONE_NUMBER.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  changePhoneNumberGet
);

router.post(
  PATH_DATA.CHANGE_PHONE_NUMBER.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  validatePhoneNumberRequest(),
  changePhoneNumberPost()
);

export { router as changePhoneNumberRouter };
