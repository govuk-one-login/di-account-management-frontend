import * as express from "express";
import { webchatGet } from "./webchat-demo-controller";
import { PATH_DATA } from "../../app.constants";

const router = express.Router();

router.get(PATH_DATA.WEBCHAT_DEMO.url, webchatGet);

export { router as webchatRouter };
