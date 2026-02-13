import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { noUkPhoneNumberGet } from "./no-uk-mobile-phone-controller";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";

const router = express.Router();

router.get(
  PATH_DATA.NO_UK_PHONE_NUMBER.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  noUkPhoneNumberGet
);

export { router as noUkMobilePhoneRouter };
