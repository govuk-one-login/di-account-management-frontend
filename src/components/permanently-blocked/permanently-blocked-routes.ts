import { PATH_DATA } from "../../app.constants";
import * as express from "express";
import { permanentlyBlockedGet } from "./permanently-blocked-controller";
import { globalTryCatch } from "../../utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.UNAVAILABLE_PERMANENT.url,
  globalTryCatch(permanentlyBlockedGet)
);

export { router as permanentlyBlockedRouter };
