import * as express from "express";
import { PATH_DATA } from "../../app.constants.js";
import { errorGet } from "./error-controller.js";

const router = express.Router();

router.get(PATH_DATA.ERROR.url, errorGet);

export { router as errorRouter };
