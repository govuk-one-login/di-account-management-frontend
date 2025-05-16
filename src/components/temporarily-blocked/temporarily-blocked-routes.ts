import { PATH_DATA } from "../../app.constants";
import * as express from "express";
import { temporarilyBlockedGet } from "./temporarily-blocked-controller";
import { globalTryCatch } from "../../utils/global-try-catch";
const router = express.Router();

router.get(
  PATH_DATA.UNAVAILABLE_TEMPORARY.url,
  globalTryCatch(temporarilyBlockedGet)
);

export { router as temporarilyBlockedRouter };
