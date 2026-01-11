import { Album } from "../models/album.model.js";


export const getAllAlbum = async (req, res, next) => {
    try {
        const albums = await Album.find({});
        res.status(200).json(albums);
    }
    catch (error) {
        console.error("Error fetching albums:", error);
        next(error);
    }
}

export const getAlbumById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        let album;
        if (!isNaN(page) && !isNaN(limit)) {
            const skip = (page - 1) * limit;

            // First get the album to know total songs
            album = await Album.findById(id).populate({
                path: 'songs',
                options: {
                    skip: skip,
                    limit: limit,
                    sort: { createdAt: 1 } // Keep consistent order
                }
            });

            if (!album) {
                return res.status(404).json({ message: "Album not found" });
            }

            // Get total song count for this album
            const fullAlbum = await Album.findById(id);
            const totalSongs = fullAlbum.songs.length;

            return res.status(200).json({
                ...album.toObject(),
                totalSongs,
                hasMoreSongs: skip + album.songs.length < totalSongs,
                currentSongPage: page
            });
        }

        album = await Album.findById(id).populate("songs");
        if (!album) {
            return res.status(404).json({ message: "Album not found" });
        }
        res.status(200).json(album);
    }
    catch (error) {
        console.error("Error fetching album by id:", error);
        next(error);
    }
}
