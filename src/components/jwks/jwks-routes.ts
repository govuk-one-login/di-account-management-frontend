import { PATH_DATA } from "../../app.constants";
import * as express from "express";
import { jwksGet } from "./jwks-controller";

const router = express.Router();

router.get(PATH_DATA.JWKS_JSON.url, jwksGet);

export { router as jwksRouter };
