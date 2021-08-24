import * as express from "express";
import { logoutGet } from "./logout-controller";

const router = express.Router();

router.get("/sign-out", logoutGet);

export { router as logoutRouter };
