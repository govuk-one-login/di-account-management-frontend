import { PATH_DATA } from "../../app.constants.js";

import * as express from "express";
import { sessionExpiredGet } from "./session-expired-controller.js";

const router = express.Router();

router.get(PATH_DATA.SESSION_EXPIRED.url, sessionExpiredGet);

export { router as sessionExpiredRouter };
