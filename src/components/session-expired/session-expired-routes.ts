import { PATH_DATA } from "../../app.constants";

import * as express from "express";
import { sessionExpiredGet } from "./session-expired-controller";

const router = express.Router();

router.get(PATH_DATA.SESSION_EXPIRED.url, sessionExpiredGet);

export { router as sessionExpiredRouter };
