import * as express from "express";
import { oidcAuthCallbackGet } from "./call-back-controller";
import { PATH_NAMES } from "../../app.constants";
import { asyncHandler } from "../../utils/async";

const router = express.Router();

router.get(PATH_NAMES.AUTH_CALLBACK, asyncHandler(oidcAuthCallbackGet()));

export { router as oidcAuthCallbackRouter };
