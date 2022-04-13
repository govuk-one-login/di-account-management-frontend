import * as express from "express";
import { globalLogoutPost } from "./global-logout-controller";
import { PATH_DATA } from "../../app.constants";
import { asyncHandler } from "../../utils/async";

const router = express.Router();

router.post(PATH_DATA.GLOBAL_LOGOUT.url, asyncHandler(globalLogoutPost));

export { router as globalLogoutRouter };
