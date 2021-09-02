import { PATH_NAMES } from "../../app.constants";
import {
  enterNewEmailPost,
  enterNewEmailGet,
} from "./enter-new-email-controller";
import * as express from "express";
import { asyncHandler } from "../../utils/async";
import { validateEnterNewEmailRequest } from "./enter-new-email-validation";

const router = express.Router();

router.get(PATH_NAMES.ENTER_NEW_EMAIL, enterNewEmailGet);

router.post(
  PATH_NAMES.ENTER_NEW_EMAIL,
  validateEnterNewEmailRequest(),
  asyncHandler(enterNewEmailPost())
);

export { router as enterNewEmailRouter };
