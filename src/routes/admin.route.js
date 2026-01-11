import { Router } from "express";
import {
    createSong, createAlbum, deleteSong, deleteAlbum, checkAdmin,
    assignSongsToAlbum, updateSong, updateAlbum, sendBroadcastNotification,
    processAudioForLyrics, getAllUsersAdmin, getUserByIdAdmin,
    updateUserAdmin, deleteUserAdmin,
    getAllAdmins, promoteToAdmin, demoteFromAdmin
} from "../controller/admin.controller.js";

import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute, requireAdmin);

router.get("/check", checkAdmin);

// Song routes
router.post("/songs", createSong);
router.put("/songs/:id", updateSong);
router.delete("/songs/:id", deleteSong);

// Album routes
router.post("/albums", createAlbum);
router.put("/albums/:id", updateAlbum);
router.delete("/albums/:id", deleteAlbum);
router.post("/albums/:id/songs", assignSongsToAlbum);

// User management routes
router.get("/users", getAllUsersAdmin);
router.get("/users/:id", getUserByIdAdmin);
router.put("/users/:id", updateUserAdmin);
router.delete("/users/:id", deleteUserAdmin);

// Admin management routes
router.get("/admins", getAllAdmins);
router.post("/admins/:userId", promoteToAdmin);
router.delete("/admins/:userId", demoteFromAdmin);

// Notification and audio processing
router.post("/notifications", sendBroadcastNotification);
router.post("/process-audio-for-lyrics", processAudioForLyrics);

export default router;
