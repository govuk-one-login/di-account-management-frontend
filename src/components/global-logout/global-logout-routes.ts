import * as express from "express";
import { globalLogoutPost } from "./global-logout-controller.js";
import { PATH_DATA } from "../../app.constants.js";
import { asyncHandler } from "../../utils/async.js";

const router = express.Router();

router.post(PATH_DATA.GLOBAL_LOGOUT.url, asyncHandler(globalLogoutPost));

export { router as globalLogoutRouter };
