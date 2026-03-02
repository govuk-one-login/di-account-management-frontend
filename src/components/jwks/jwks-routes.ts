import { PATH_DATA } from "../../app.constants.js";
import * as express from "express";
import { jwksGet } from "./jwks-controller.js";

const router = express.Router();

router.get(PATH_DATA.JWKS.url, jwksGet);

export { router as jwksRouter };
