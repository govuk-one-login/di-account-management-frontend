import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { validatePhoneNumberRequest } from "./change-phone-number-validation";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import {
  changePhoneNumberGet,
  changePhoneNumberPost,
  noUkPhoneNumberGet,
} from "./change-phone-number-controller";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";

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
  validateStateMiddleware,
  (req, res) => {
    res.redirect(PATH_DATA.SECURITY.url);
  },
  noUkPhoneNumberGet
);

export { router as changePhoneNumberRouter };
