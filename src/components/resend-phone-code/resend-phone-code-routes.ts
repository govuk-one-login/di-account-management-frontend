import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";

import {
  resendPhoneCodeGet,
  resendPhoneCodePost,
} from "./resend-phone-code-controller.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";

const router = express.Router();

router.get(
  PATH_DATA.RESEND_PHONE_CODE.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  resendPhoneCodeGet
);

router.post(
  PATH_DATA.RESEND_PHONE_CODE.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  resendPhoneCodePost()
);

export { router as resendPhoneCodeRouter };
