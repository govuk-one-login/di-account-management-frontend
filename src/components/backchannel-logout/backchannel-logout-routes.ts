import * as express from "express";
import { backchannelLogoutPost } from "./backchannel-logout-controller";
import { PATH_DATA } from "../../app.constants";
import { asyncHandler } from "../../utils/async";
import { globalTryCatchAsync } from "../../utils/global-try-catch";

const router = express.Router();

router.post(
  PATH_DATA.BACKCHANNEL_LOGOUT.url,
  globalTryCatchAsync(asyncHandler(backchannelLogoutPost))
);

router.post(
  PATH_DATA.GLOBAL_LOGOUT.url,
  globalTryCatchAsync(asyncHandler(backchannelLogoutPost))
);

export { router as backchannelLogoutRouter };
