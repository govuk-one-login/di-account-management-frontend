import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";

import {
  resendEmailCodeGet,
  resendEmailCodePost,
} from "./resend-email-code-controller.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";

import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";

const router = express.Router();

router.get(
  PATH_DATA.RESEND_EMAIL_CODE.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  resendEmailCodeGet
);

router.post(
  PATH_DATA.RESEND_EMAIL_CODE.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  resendEmailCodePost()
);

export { router as resendEmailCodeRouter };
