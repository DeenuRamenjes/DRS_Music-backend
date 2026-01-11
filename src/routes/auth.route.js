import { Router } from "express";
import { mobileAuth, emailLogin, getMe } from "../controller/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

// Mobile/Google Sign-In authentication
router.post("/mobile", mobileAuth);
router.post("/email-login", emailLogin);
router.get("/me", protectRoute, getMe);


export default router;