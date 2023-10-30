import * as express from "express";
import { contactGet } from "./contact-govuk-one-login-controller";
import { PATH_DATA } from "../../app.constants";
import { updateSessionMiddleware } from "../../middleware/update-session-middleware";

const router = express.Router();

router.get(PATH_DATA.CONTACT.url, updateSessionMiddleware, contactGet);

export { router as contactRouter };
