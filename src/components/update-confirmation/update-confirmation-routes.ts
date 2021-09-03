import { PATH_NAMES } from "../../app.constants";

import * as express from "express";
import { updateConfirmationEmailGet } from "./update-confirmation-controller";

const router = express.Router();

router.get(
  PATH_NAMES.EMAIL_UPDATED_CONFIRMATION,
  updateConfirmationEmailGet
);

export { router as updateConfirmationRouter };