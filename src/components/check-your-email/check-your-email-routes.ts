import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import {
  checkYourEmailGet,
  checkYourEmailPost,
  requestNewCodeGet,
} from "./check-your-email-controller";
import { validateCheckYourEmailRequest } from "./check-your-email-validation";
import { asyncHandler } from "../../utils/async";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";
import { refreshTokenMiddleware } from "../../middleware/refresh-token-middleware";

const router = express.Router();

router.get(
  PATH_DATA.CHECK_YOUR_EMAIL.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  checkYourEmailGet
);

router.get(
  PATH_DATA.REQUEST_NEW_CODE_EMAIL.url,
  requiresAuthMiddleware,
  requestNewCodeGet
);

router.post(
  PATH_DATA.CHECK_YOUR_EMAIL.url,
  requiresAuthMiddleware,
  validateCheckYourEmailRequest(),
  refreshTokenMiddleware(),
  asyncHandler(checkYourEmailPost())
);

export { router as checkYourEmailRouter };
