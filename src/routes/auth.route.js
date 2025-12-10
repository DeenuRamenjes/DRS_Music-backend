import { Router } from "express";
import { authCallback, mobileAuth, getMe } from "../controller/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();


router.post("/callback", authCallback);
router.post("/mobile", mobileAuth);
router.get("/me", protectRoute, getMe);


export default router;