import * as express from "express";
import { backchannelLogoutPost } from "./backchannel-logout-controller";
import { PATH_DATA } from "../../app.constants";

const router = express.Router();

router.post(PATH_DATA.BACKCHANNEL_LOGOUT.url, backchannelLogoutPost);

export { router as backchannelLogoutRouter };
