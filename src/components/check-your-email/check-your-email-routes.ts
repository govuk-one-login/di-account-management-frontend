import * as express from "express";
import { PATH_DATA } from "../../app.constants";
import {
  checkYourEmailGet,
  checkYourEmailPost,
} from "./check-your-email-controller";
import { validateCheckYourEmailRequest } from "./check-your-email-validation";
import { requiresAuthMiddleware } from "../../middleware/requires-auth-middleware";
import { validateStateMiddleware } from "../../middleware/validate-state-middleware";

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
