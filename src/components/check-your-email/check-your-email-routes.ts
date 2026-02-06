import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";
import {
  checkYourEmailGet,
  checkYourEmailPost,
} from "./check-your-email-controller.js";
import { validateCheckYourEmailRequest } from "./check-your-email-validation.js";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware.js";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware.js";

const router = express.Router();

router.get(
  PATH_DATA.CHECK_YOUR_EMAIL.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  checkYourEmailGet
);

router.post(
  PATH_DATA.CHECK_YOUR_EMAIL.url,
  requiresAuthMiddleware,
  validateStateMiddleware,
  validateCheckYourEmailRequest(),
  checkYourEmailPost()
);

export { router as checkYourEmailRouter };
