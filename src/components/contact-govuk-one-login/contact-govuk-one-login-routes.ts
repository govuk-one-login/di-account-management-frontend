import * as express from "express";
import helmet from "helmet";
import { contactGet } from "./contact-govuk-one-login-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { updateSessionMiddleware } from "../../middleware/update-session-middleware.js";
import { webchatHelmetConfiguration } from "../../config/helmet.js";

const router = express.Router();

router.use(PATH_DATA.CONTACT.url, helmet(webchatHelmetConfiguration));

router.get(PATH_DATA.CONTACT.url, updateSessionMiddleware, contactGet);

export { router as contactRouter };
