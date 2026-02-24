import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { noUkPhoneNumberGet } from "./no-uk-mobile-phone-controller";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { SetState } from "../../utils/set-state";
import { EventType, UserJourney } from "../../utils/state-machine";

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
