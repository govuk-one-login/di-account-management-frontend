import * as express from "express";
import { logoutRedirectGet } from "./logout-redirect-controller.js";
import { PATH_DATA } from "../../app.constants.js";

const router = express.Router();

router.get(PATH_DATA.LOGOUT_REDIRECT.url, logoutRedirectGet);

export { router as logoutRedirectRouter };
