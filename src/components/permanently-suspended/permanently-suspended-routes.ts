import { PATH_DATA } from "../../app.constants";
import * as express from "express";
import { permanentlySuspendedGet } from "./permanently-suspended-controller";
import { globalTryCatch } from "../../utils/global-try-catch";

const router = express.Router();

router.get(
  PATH_DATA.UNAVAILABLE_PERMANENT.url,
  globalTryCatch(permanentlySuspendedGet)
);

export { router as permanentlySuspendedRouter };
