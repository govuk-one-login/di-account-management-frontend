import * as express from "express";
import { robotsTxtGet } from "./robots-txt-routes";

const router = express.Router();

router.get("/robots.txt", robotsTxtGet);

export { router as robotsTxtRouter };
