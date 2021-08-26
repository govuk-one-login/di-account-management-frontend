import * as express from "express";
import { PATH_NAMES } from "../../app.constants";
import {
  enterPasswordGet,
  enterPasswordPost,
} from "./enter-password-controller";
import { asyncHandler } from "../../utils/async";
import { validateEnterPasswordRequest } from "./enter-password-validation";

const router = express.Router();

router.get(PATH_NAMES.ENTER_PASSWORD, enterPasswordGet);
router.post(
  PATH_NAMES.ENTER_PASSWORD,
  validateEnterPasswordRequest(),
  asyncHandler(enterPasswordPost())
);

export { router as enterPasswordRouter };
