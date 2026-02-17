import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { validatePhoneNumberRequest } from "./change-phone-number-validation";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import {
  changePhoneNumberGet,
  changePhoneNumberPost,
} from "./change-phone-number-controller";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { EventType, UserJourney } from "../../utils/state-machine";

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
