import * as express from "express";
import { backchannelLogoutPost } from "./backchannel-logout-controller";
import { PATH_DATA } from "../../app.constants";
import { globalTryCatchAsync } from "../../utils/global-try-catch";

const router = express.Router();

router.post(
  PATH_DATA.BACKCHANNEL_LOGOUT.url,
  globalTryCatchAsync(backchannelLogoutPost)
);

router.post(
  PATH_DATA.GLOBAL_LOGOUT.url,
  globalTryCatchAsync(backchannelLogoutPost)
);

export { router as backchannelLogoutRouter };
