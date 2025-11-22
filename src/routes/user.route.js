import { Router } from "express";
import { getAllUsers, getMessages, getLikedSongs, likeSong, unlikeSong } from "../controller/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/",protectRoute, getAllUsers);
router.get("/messages/:userId",protectRoute, getMessages);
router.get("/me/likes", protectRoute, getLikedSongs);
router.post("/me/likes/:songId", protectRoute, likeSong);
router.delete("/me/likes/:songId", protectRoute, unlikeSong);

export default router;