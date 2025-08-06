import { PATH_DATA } from "../../app.constants";
import * as express from "express";
import { temporarilySuspendedGet } from "./temporarily-suspended-controller";

const router = express.Router();

router.get(PATH_DATA.UNAVAILABLE_TEMPORARY.url, temporarilySuspendedGet);

export { router as temporarilySuspendedRouter };
