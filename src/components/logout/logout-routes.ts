import * as express from "express";
import { logoutGet } from "./logout-controller";
import { PATH_DATA } from "../../app.constants";

const router = express.Router();

router.get(PATH_DATA.SIGN_OUT.url, logoutGet);

export { router as logoutRouter };
