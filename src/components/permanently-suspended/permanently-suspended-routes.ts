import { PATH_DATA } from "../../app.constants";
import * as express from "express";
import { permanentlySuspendedGet } from "./permanently-suspended-controller";

const router = express.Router();

router.get(PATH_DATA.UNAVAILABLE_PERMANENT.url, permanentlySuspendedGet);

export { router as permanentlySuspendedRouter };
