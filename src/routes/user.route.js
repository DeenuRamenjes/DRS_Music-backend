import { Router } from "express";
import { getAllUsers, getMessages, sendMessage, getLikedSongs, likeSong, unlikeSong, deleteUser, getLastSeenData, getSettings, updateSettings, updatePlaybackSettings } from "../controller/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", protectRoute, getAllUsers);
router.get("/last-seen", protectRoute, getLastSeenData);
router.get("/messages/:userId", protectRoute, getMessages);
router.post("/messages", protectRoute, sendMessage);
router.get("/me/likes", protectRoute, getLikedSongs);
router.post("/me/likes/:songId", protectRoute, likeSong);
router.delete("/me/likes/:songId", protectRoute, unlikeSong);
router.delete("/me", protectRoute, deleteUser);

// Settings routes
router.get("/me/settings", protectRoute, getSettings);
router.put("/me/settings", protectRoute, updateSettings);
router.patch("/me/settings/playback", protectRoute, updatePlaybackSettings);

export default router;