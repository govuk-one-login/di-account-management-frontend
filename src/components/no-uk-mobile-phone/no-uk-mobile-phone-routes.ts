import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { noUkPhoneNumberGet } from "./no-uk-mobile-phone-controller.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";
import { SetState } from "../../utils/set-state.js";
import { EventType, UserJourney } from "../../utils/state-machine.js";

const router = express.Router();

router.get(
  PATH_DATA.NO_UK_PHONE_NUMBER.url,
  requiresAuthMiddleware,
  SetState(
    [UserJourney.ChangePhoneNumber, UserJourney.ChangeDefaultMethod],
    UserJourney.NoUKMobilePhone,
    EventType.ValueUpdated,
    "CONFIRMATION"
  ),
  validateStateMiddleware,
  noUkPhoneNumberGet
);

export { router as noUkMobilePhoneRouter };
