import * as express from "express";
import { startGet } from "./start-controller";
import { PATH_DATA } from "../../app.constants";
import { globalTryCatchAsync } from "../../utils/global-try-catch";

const router = express.Router();

router.get(PATH_DATA.START.url, globalTryCatchAsync(startGet));

export { router as startRouter };
