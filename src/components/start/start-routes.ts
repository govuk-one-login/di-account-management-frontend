import * as express from "express";
import { startGet } from "./start-controller.js";
import { PATH_DATA } from "../../app.constants.js";

const router = express.Router();

router.get(PATH_DATA.START.url, startGet);

export { router as startRouter };
