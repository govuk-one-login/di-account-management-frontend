import { deviceInformationGet } from "./device-information-controller";
import * as express from "express";

const router = express.Router();

router.get("/device-information", deviceInformationGet);

export { router as deviceInformationRouter };
