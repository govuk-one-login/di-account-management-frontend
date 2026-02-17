import * as express from "express";
import { oidcAuthCallbackGet } from "./call-back-controller.js";
import { PATH_DATA } from "../../app.constants.js";

const router = express.Router();

router.get(PATH_DATA.AUTH_CALLBACK.url, oidcAuthCallbackGet());

export { router as oidcAuthCallbackRouter };
