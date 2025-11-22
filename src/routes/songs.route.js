import { Router } from "express";
import { getAllSong, getMadeForYouSong, getTreandingSong, getFeaturedSong, getSongById, searchSongs } from "../controller/song.controller.js";

import { protectRoute,requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/",getAllSong)
router.get("/featured",getFeaturedSong)
router.get("/made-for-you",getMadeForYouSong)
router.get("/trending",getTreandingSong)
router.get("/search",searchSongs)
router.get("/:id",getSongById)

export default router;