import * as express from "express";
import { contactGet } from "./contact-govuk-one-login-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { updateSessionMiddleware } from "../../middleware/update-session-middleware.js";

const router = express.Router();

router.get(PATH_DATA.CONTACT.url, updateSessionMiddleware, contactGet);

export { router as contactRouter };
