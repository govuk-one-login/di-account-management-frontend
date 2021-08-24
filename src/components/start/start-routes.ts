import * as express from "express";
import { startGet } from "./start-controller";

const router = express.Router();

router.get("/", startGet);

export { router as startRouter };
