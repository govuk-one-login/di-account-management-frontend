import * as express from "express";
import { contactGet } from "./contact-govuk-one-login-controller";
import { PATH_DATA } from "../../app.constants";

const router = express.Router();

router.get(PATH_DATA.CONTACT.url, contactGet);

export { router as contactRouter };
