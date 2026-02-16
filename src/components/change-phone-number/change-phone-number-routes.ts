import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { validatePhoneNumberRequest } from "./change-phone-number-validation";
import { SetState } from "../../utils/set-state";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import {
  changePhoneNumberGet,
  changePhoneNumberPost,
  noUkPhoneNumberGet,
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

router.get(
  PATH_DATA.NO_UK_PHONE_NUMBER.url,
  requiresAuthMiddleware,
  SetState(
    UserJourney.ChangePhoneNumber,
    UserJourney.NoUKMobilePhone,
    EventType.ValueUpdated,
    "VALUE_UPDATED"
  ),
  validateStateMiddleware,
  noUkPhoneNumberGet
);

export { router as changePhoneNumberRouter };
