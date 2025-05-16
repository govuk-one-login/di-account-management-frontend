import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import { validatePhoneNumberRequest } from "./change-phone-number-validation";
import { asyncHandler } from "../../utils/async";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import {
  changePhoneNumberGet,
  changePhoneNumberPost,
} from "./change-phone-number-controller";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware";
import { globalTryCatchAsync } from "../../utils/global-try-catch";

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
  refreshTokenMiddleware(),
  globalTryCatchAsync(asyncHandler(changePhoneNumberPost()))
);

export { router as changePhoneNumberRouter };
