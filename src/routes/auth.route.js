import { Router } from "express";
import { authCallback, mobileAuth } from "../controller/auth.controller.js";

const router = Router();


router.post("/callback", authCallback);
router.post("/mobile", mobileAuth);


export default router;