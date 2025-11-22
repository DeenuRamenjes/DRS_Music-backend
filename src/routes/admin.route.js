import { Router } from "express";
import { createSong, createAlbum, deleteSong, deleteAlbum ,checkAdmin, assignSongsToAlbum, updateSong, updateAlbum, sendBroadcastNotification} from "../controller/admin.controller.js";

import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protectRoute,requireAdmin);

router.get("/check",checkAdmin);

router.post("/songs",createSong);
router.put("/songs/:id",updateSong);
router.delete("/songs/:id",deleteSong);

router.post("/albums",createAlbum);
router.put("/albums/:id",updateAlbum);
router.delete("/albums/:id",deleteAlbum);
router.post("/albums/:id/songs", assignSongsToAlbum);
router.post("/notifications", sendBroadcastNotification);

export default router;