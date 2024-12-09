import * as express from "express";
import { globalLogoutPost } from "./global-logout-controller";
import { PATH_DATA } from "../../app.constants";
import { asyncHandler } from "../../utils/async";
import { globalTryCatchAsync } from "../../utils/global-try-catch";

const router = express.Router();

router.post(
  PATH_DATA.GLOBAL_LOGOUT.url,
  globalTryCatchAsync(asyncHandler(globalLogoutPost))
);

export { router as globalLogoutRouter };
