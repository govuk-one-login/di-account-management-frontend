import { PATH_DATA } from "../../app.constants";

import * as express from "express";
import { healthcheckGet } from "./healthcheck-controller";

const router = express.Router();

router.get(PATH_DATA.HEALTHCHECK.url, healthcheckGet);

export { router as healthcheckRouter };
